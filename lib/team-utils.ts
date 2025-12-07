
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

export const getCurrentUserTeamId = async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return null;

    const user = await (prismadb.users as any).findUnique({
        where: { email: session.user.email },
        select: {
            team_id: true,
            is_admin: true,
            team_role: true,
            assigned_team: {
                select: { slug: true }
            }
        }
    });

    const isInternalTeam = user?.assigned_team?.slug === "ledger1";
    const isSuperAdminRole = user?.team_role === "SUPER_ADMIN";

    // "God Mode" only for SUPER_ADMIN in Internal Team
    const isGlobalAdmin = isInternalTeam && isSuperAdminRole;

    return {
        teamId: user?.team_id,
        isGlobalAdmin: isGlobalAdmin,
        teamRole: user?.team_role,
        isAdmin: user?.is_admin || user?.team_role === "ADMIN" || user?.team_role === "OWNER" || isGlobalAdmin
    };
}
