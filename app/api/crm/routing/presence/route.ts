import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

// POST: Update agent presence (heartbeat + status change)
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthenticated", { status: 401 });

    try {
        const teamInfo = await getCurrentUserTeamId();
        const body = await req.json();
        const { status, max_capacity, channels_enabled } = body;

        // Upsert agent presence
        const presence = await (prismadb as any).agentPresence.upsert({
            where: { user_id: session.user.id },
            update: {
                ...(status && { status }),
                ...(max_capacity !== undefined && { max_capacity }),
                ...(channels_enabled && { channels_enabled }),
                last_heartbeat: new Date(),
                ...(status === "ONLINE" && { available_since: new Date() }),
            },
            create: {
                user_id: session.user.id,
                status: status || "ONLINE",
                max_capacity: max_capacity || 5,
                channels_enabled: channels_enabled || ["CASE"],
                last_heartbeat: new Date(),
                available_since: new Date(),
                team_id: teamInfo?.teamId || undefined,
            },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
            },
        });

        return NextResponse.json(presence);
    } catch (error) {
        console.error("[AGENT_PRESENCE_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// GET: Get all agent presences for the team (supervisor view)
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthenticated", { status: 401 });

    try {
        const teamInfo = await getCurrentUserTeamId();
        const where: any = {};

        if (!teamInfo?.isGlobalAdmin && teamInfo?.teamId) {
            where.team_id = teamInfo.teamId;
        }

        const presences = await (prismadb as any).agentPresence.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, email: true, avatar: true } },
            },
            orderBy: [{ status: "asc" }, { current_load: "asc" }],
        });

        return NextResponse.json(presences);
    } catch (error) {
        console.error("[AGENT_PRESENCE_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
