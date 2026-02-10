import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

/**
 * Smart Router — Case Router
 * Determines the best agent to assign a case to based on the team's routing strategy.
 */

interface RouteResult {
    userId: string;
    userName: string;
    strategy: string;
}

async function findBestAgent(
    teamId: string,
    casePriority: string,
    caseType?: string | null
): Promise<RouteResult | null> {
    // 1. Get routing config for the team
    const config = await (prismadb as any).routingConfig.findUnique({
        where: { team_id: teamId },
    });

    if (!config || !config.auto_assign_enabled) return null;

    // 2. Determine strategy (priority override or default)
    let strategy: string = config.strategy;
    if (config.priority_overrides) {
        const overrides =
            typeof config.priority_overrides === "string"
                ? JSON.parse(config.priority_overrides)
                : config.priority_overrides;
        if (overrides[casePriority]) strategy = overrides[casePriority];
    }

    // 3. Get all online/away agents with capacity
    const availableAgents = await (prismadb as any).agentPresence.findMany({
        where: {
            team_id: teamId,
            status: { in: ["ONLINE", "AWAY"] },
            current_load: { lt: (prismadb as any).agentPresence.fields?.max_capacity || 999 },
        },
        include: {
            user: { select: { id: true, name: true } },
        },
        orderBy: { current_load: "asc" },
    });

    // Fallback: use raw query to find agents where current_load < max_capacity
    const onlineAgents = availableAgents.filter(
        (a: any) => a.current_load < a.max_capacity
    );

    if (onlineAgents.length === 0) {
        // Fall back to fallback user if configured
        if (config.fallback_user_id) {
            const fallback = await prismadb.users.findUnique({
                where: { id: config.fallback_user_id },
                select: { id: true, name: true },
            });
            if (fallback) {
                return {
                    userId: fallback.id,
                    userName: fallback.name || "Fallback Agent",
                    strategy: "FALLBACK",
                };
            }
        }
        return null;
    }

    // 4. Apply strategy
    switch (strategy) {
        case "ROUND_ROBIN": {
            // Find the next agent after last_assigned_user_id
            const lastIdx = onlineAgents.findIndex(
                (a: any) => a.user_id === config.last_assigned_user_id
            );
            const nextIdx = (lastIdx + 1) % onlineAgents.length;
            const selected = onlineAgents[nextIdx];

            // Update pointer
            await (prismadb as any).routingConfig.update({
                where: { id: config.id },
                data: { last_assigned_user_id: selected.user_id },
            });

            return {
                userId: selected.user_id,
                userName: selected.user?.name || "Agent",
                strategy: "ROUND_ROBIN",
            };
        }

        case "LEAST_BUSY": {
            // Already sorted by current_load asc
            const selected = onlineAgents[0];
            return {
                userId: selected.user_id,
                userName: selected.user?.name || "Agent",
                strategy: "LEAST_BUSY",
            };
        }

        case "SKILL_BASED": {
            // Get required skills for this case type
            let requiredSkills: string[] = [];
            if (caseType && config.type_skill_map) {
                const skillMap =
                    typeof config.type_skill_map === "string"
                        ? JSON.parse(config.type_skill_map)
                        : config.type_skill_map;
                requiredSkills = skillMap[caseType] || [];
            }

            if (requiredSkills.length === 0) {
                // No skill requirements → fall back to least busy
                return {
                    userId: onlineAgents[0].user_id,
                    userName: onlineAgents[0].user?.name || "Agent",
                    strategy: "SKILL_BASED_FALLBACK",
                };
            }

            // Find agents with matching skills
            const agentIds = onlineAgents.map((a: any) => a.user_id);
            const matchingSkills = await (prismadb as any).agentSkill.findMany({
                where: {
                    user_id: { in: agentIds },
                    skill_name: { in: requiredSkills },
                },
            });

            // Score agents by number of matching skills * proficiency
            const scoreMap: Record<string, number> = {};
            for (const skill of matchingSkills) {
                scoreMap[skill.user_id] =
                    (scoreMap[skill.user_id] || 0) + skill.proficiency;
            }

            // Sort by score then by current_load
            const scoredAgents = onlineAgents
                .filter((a: any) => scoreMap[a.user_id])
                .sort(
                    (a: any, b: any) =>
                        (scoreMap[b.user_id] || 0) - (scoreMap[a.user_id] || 0) ||
                        a.current_load - b.current_load
                );

            if (scoredAgents.length > 0) {
                return {
                    userId: scoredAgents[0].user_id,
                    userName: scoredAgents[0].user?.name || "Agent",
                    strategy: "SKILL_BASED",
                };
            }

            // No skilled agents available — least busy fallback
            return {
                userId: onlineAgents[0].user_id,
                userName: onlineAgents[0].user?.name || "Agent",
                strategy: "SKILL_BASED_FALLBACK",
            };
        }

        case "PRIORITY_QUEUE": {
            // For critical/high: pick highest CSAT agent; for others: round-robin
            if (casePriority === "CRITICAL" || casePriority === "HIGH") {
                const sorted = [...onlineAgents].sort(
                    (a: any, b: any) => (b.csat_score || 0) - (a.csat_score || 0)
                );
                return {
                    userId: sorted[0].user_id,
                    userName: sorted[0].user?.name || "Agent",
                    strategy: "PRIORITY_QUEUE",
                };
            }
            // Low/Medium: least busy
            return {
                userId: onlineAgents[0].user_id,
                userName: onlineAgents[0].user?.name || "Agent",
                strategy: "PRIORITY_QUEUE_STANDARD",
            };
        }

        default:
            return {
                userId: onlineAgents[0].user_id,
                userName: onlineAgents[0].user?.name || "Agent",
                strategy: "DEFAULT",
            };
    }
}

// POST: Route a case to the best agent
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthenticated", { status: 401 });

    try {
        const { case_id } = await req.json();
        if (!case_id) return new NextResponse("case_id is required", { status: 400 });

        const caseData = await (prismadb as any).crm_Cases.findUnique({
            where: { id: case_id },
            select: { id: true, team_id: true, priority: true, type: true, assigned_to: true },
        });

        if (!caseData) return new NextResponse("Case not found", { status: 404 });
        if (!caseData.team_id) return new NextResponse("Case has no team", { status: 400 });

        const result = await findBestAgent(
            caseData.team_id,
            caseData.priority,
            caseData.type
        );

        if (!result) {
            return NextResponse.json(
                { routed: false, message: "No available agents" },
                { status: 200 }
            );
        }

        // Assign the case
        await (prismadb as any).crm_Cases.update({
            where: { id: case_id },
            data: { assigned_to: result.userId },
        });

        // Increment agent's current load
        await (prismadb as any).agentPresence.updateMany({
            where: { user_id: result.userId },
            data: { current_load: { increment: 1 } },
        });

        return NextResponse.json({
            routed: true,
            agentId: result.userId,
            agentName: result.userName,
            strategy: result.strategy,
        });
    } catch (error) {
        console.error("[ROUTE_CASE_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
