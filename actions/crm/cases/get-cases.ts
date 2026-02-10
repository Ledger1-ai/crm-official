"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export const getCases = async (filters?: {
    status?: string;
    priority?: string;
    assigned_to?: string;
}) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];

    const teamInfo = await getCurrentUserTeamId();
    if (!teamInfo?.teamId && !teamInfo?.isGlobalAdmin) return [];

    const where: any = {};

    // Team scoping
    if (!teamInfo.isGlobalAdmin && teamInfo.teamId) {
        where.team_id = teamInfo.teamId;
    }

    // Apply filters
    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.assigned_to) where.assigned_to = filters.assigned_to;

    try {
        const cases = await (prismadb as any).crm_Cases.findMany({
            where,
            include: {
                contact: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
                account: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                assigned_user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
                creator: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                sla_policy: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        comments: true,
                    },
                },
            },
            orderBy: [
                { priority: "desc" },
                { createdAt: "desc" },
            ],
        });

        return cases;
    } catch (error) {
        console.error("[GET_CASES]", error);
        return [];
    }
};
