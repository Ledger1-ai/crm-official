"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export const getCaseStats = async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    const teamInfo = await getCurrentUserTeamId();
    if (!teamInfo?.teamId && !teamInfo?.isGlobalAdmin) return null;

    const where: any = {};
    if (!teamInfo.isGlobalAdmin && teamInfo.teamId) {
        where.team_id = teamInfo.teamId;
    }

    try {
        const [
            totalCases,
            openCases,
            criticalCases,
            slaBreach,
            resolvedToday,
            newToday,
        ] = await Promise.all([
            (prismadb as any).crm_Cases.count({ where }),
            (prismadb as any).crm_Cases.count({
                where: {
                    ...where,
                    status: { in: ["NEW", "OPEN", "IN_PROGRESS", "ESCALATED"] },
                },
            }),
            (prismadb as any).crm_Cases.count({
                where: { ...where, priority: "CRITICAL" },
            }),
            (prismadb as any).crm_Cases.count({
                where: { ...where, sla_breached: true },
            }),
            (prismadb as any).crm_Cases.count({
                where: {
                    ...where,
                    resolvedAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                },
            }),
            (prismadb as any).crm_Cases.count({
                where: {
                    ...where,
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                },
            }),
        ]);

        return {
            totalCases,
            openCases,
            criticalCases,
            slaBreach,
            resolvedToday,
            newToday,
        };
    } catch (error) {
        console.error("[GET_CASE_STATS]", error);
        return null;
    }
};
