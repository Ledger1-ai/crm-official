import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export const getProjectStats = async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { activeTasks: 0, documents: 0 };

    const teamInfo = await getCurrentUserTeamId();
    if (!teamInfo?.teamId && !teamInfo?.isGlobalAdmin) return { activeTasks: 0, documents: 0 };

    const whereClause: any = {};
    if (!teamInfo?.isGlobalAdmin) {
        whereClause.team_id = teamInfo?.teamId;
    }

    // Count active tasks (not COMPLETE)
    const activeTasks = await prismadb.tasks.count({
        where: {
            ...whereClause,
            taskStatus: {
                not: "COMPLETE",
            },
        },
    });

    // Count documents
    const documents = await prismadb.documents.count({
        where: whereClause,
    });

    return { activeTasks, documents };
};
