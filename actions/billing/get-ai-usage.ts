"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface AiUsageSummary {
    service: string;
    total_tokens_in: number;
    total_tokens_out: number;
    total_cost: number;
    request_count: number;
}

/**
 * Get AI usage logs for a specific team (detailed).
 * Supports optional date range filtering.
 */
export async function getTeamAiUsage(
    teamId: string,
    opts?: { startDate?: Date; endDate?: Date; limit?: number }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return [];

        const where: any = { tenant_id: teamId };
        if (opts?.startDate || opts?.endDate) {
            where.createdAt = {};
            if (opts?.startDate) where.createdAt.gte = opts.startDate;
            if (opts?.endDate) where.createdAt.lte = opts.endDate;
        }

        // diverse-safety-check: ensure the model exists on the runtime client (handling dev-mode stale client)
        if (!(prismadb as any).crm_AiUsageLog) {
            console.warn("Prisma Client is stale. crm_AiUsageLog model not found. Please restart the server.");
            return [];
        }

        const logs = await (prismadb as any).crm_AiUsageLog.findMany({
            where,
            include: {
                user: {
                    select: { name: true, email: true, avatar: true }
                }
            },
            orderBy: { createdAt: "desc" },
            take: opts?.limit || 200
        });

        return logs;
    } catch (error) {
        console.error("[GET_TEAM_AI_USAGE]", error);
        return [];
    }
}

/**
 * Get AI usage summary for a specific team, grouped by service.
 * Returns aggregated totals per service for the given month.
 */
export async function getTeamAiUsageSummary(
    teamId: string,
    month?: Date
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return [];

        const now = month || new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // diverse-safety-check: ensure the model exists on the runtime client (handling dev-mode stale client)
        if (!(prismadb as any).crm_AiUsageLog) {
            console.warn("Prisma Client is stale. crm_AiUsageLog model not found. Please restart the server.");
            return [];
        }

        const logs = await (prismadb as any).crm_AiUsageLog.findMany({
            where: {
                tenant_id: teamId,
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            },
            select: {
                service: true,
                tokens_in: true,
                tokens_out: true,
                cost: true,
            }
        });

        // Group by service
        const summaryMap = new Map<string, AiUsageSummary>();
        for (const log of logs) {
            const existing = summaryMap.get(log.service) || {
                service: log.service,
                total_tokens_in: 0,
                total_tokens_out: 0,
                total_cost: 0,
                request_count: 0,
            };
            existing.total_tokens_in += log.tokens_in;
            existing.total_tokens_out += log.tokens_out;
            existing.total_cost += log.cost;
            existing.request_count += 1;
            summaryMap.set(log.service, existing);
        }

        return Array.from(summaryMap.values()).sort((a, b) => b.total_cost - a.total_cost);
    } catch (error) {
        console.error("[GET_TEAM_AI_USAGE_SUMMARY]", error);
        return [];
    }
}

/**
 * Get AI usage for the current user's team.
 */
export async function getMyTeamAiUsage(opts?: { limit?: number }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { logs: [], summary: [] };

        const user = await prismadb.users.findUnique({
            where: { id: session.user.id },
            select: { team_id: true }
        });

        if (!user?.team_id) return { logs: [], summary: [] };

        const [logs, summary] = await Promise.all([
            getTeamAiUsage(user.team_id, { limit: opts?.limit || 100 }),
            getTeamAiUsageSummary(user.team_id)
        ]);

        return { logs, summary };
    } catch (error) {
        console.error("[GET_MY_TEAM_AI_USAGE]", error);
        return { logs: [], summary: [] };
    }
}
