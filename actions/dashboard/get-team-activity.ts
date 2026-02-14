"use server";

import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { formatDistanceToNow } from "date-fns";

export const getTeamActivity = async () => {
    try {
        const teamInfo = await getCurrentUserTeamId();
        if (!teamInfo?.teamId && !teamInfo?.isGlobalAdmin) return [];

        // For now, SystemActivity might not be team-filtered in schema, 
        // but we can join with User to ensure it's team activity.
        const activities = await prismadb.systemActivity.findMany({
            where: {
                user: {
                    ...(teamInfo.isGlobalAdmin ? {} : { team_id: teamInfo.teamId })
                }
            },
            include: {
                user: {
                    select: {
                        name: true,
                        avatar: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 20
        });

        return activities.map(a => ({
            id: a.id,
            user: a.user?.name || "Unknown User",
            avatar: a.user?.avatar,
            action: a.action,
            target: a.resource,
            time: formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })
        }));
    } catch (error) {
        console.error("Error fetching team activity:", error);
        return [];
    }
};
