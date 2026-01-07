import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";

/**
 * GET /api/team/members
 * Returns team members for assignment dropdowns
 */
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const teamInfo = await getCurrentUserTeamId();
        const teamId = teamInfo?.teamId;

        // Build query - if team, get team members; otherwise get all users (for super admin)
        const whereClause: any = {};

        if (teamId && !teamInfo?.isGlobalAdmin) {
            whereClause.team_id = teamId;
        }

        const members = await prismadb.users.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                team_role: true,
                is_admin: true,
                userStatus: true,
            },
            orderBy: { name: "asc" },
            take: 100,
        });

        // Filter out inactive users
        const activeMembers = members.filter((m: any) => m.userStatus !== "INACTIVE");

        const result = activeMembers.map((m: any) => ({
            id: m.id,
            name: m.name || m.email,
            email: m.email,
            avatar: m.avatar,
            team_role: m.team_role,
        }));

        return NextResponse.json({ members: result }, { status: 200 });
    } catch (error) {
        console.error("[TEAM_MEMBERS_GET]", error);
        return new NextResponse("Failed to fetch team members", { status: 500 });
    }
}
