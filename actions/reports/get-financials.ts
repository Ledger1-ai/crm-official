"use server";

import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export const getFinancialsByMonth = async (startDate?: Date, endDate?: Date, departmentId?: string) => {
    const teamInfo = await getCurrentUserTeamId();
    if (!teamInfo?.teamId && !teamInfo?.isGlobalAdmin) return [];

    const whereClause: any = {};

    if (!teamInfo?.isGlobalAdmin) {
        whereClause.team_id = teamInfo?.teamId;
    }

    if (departmentId && departmentId !== "all") {
        whereClause.assigned_department_id = departmentId;
    }

    if (startDate && endDate) {
        whereClause.date_created = {
            gte: startDate,
            lte: endDate,
        };
    } else {
        const currentYear = new Date().getFullYear();
        whereClause.date_created = {
            gte: new Date(currentYear, 0, 1),
            lte: new Date(currentYear, 11, 31),
        };
    }

    const invoices = await (prismadb.invoices as any).findMany({
        where: whereClause,
        select: {
            date_created: true,
            invoice_amount: true,
            status: true,
        },
        orderBy: {
            date_created: "asc",
        }
    });

    const revenueByMonth = invoices.reduce((acc: any, inv: any) => {
        if (!inv.date_created) return acc;
        const amountStr = inv.invoice_amount || "0";
        const amount = parseFloat(amountStr.replace(/[^0-9.-]+/g, ""));
        const date = new Date(inv.date_created);
        const month = date.toLocaleString("default", { month: "long" });
        acc[month] = (acc[month] || 0) + amount;
        return acc;
    }, {});

    return Object.keys(revenueByMonth).map((month: any) => ({
        name: month,
        "Revenue": revenueByMonth[month],
    }));
};

export const getContractsStats = async (startDate?: Date, endDate?: Date) => {
    const teamInfo = await getCurrentUserTeamId();
    if (!teamInfo?.teamId && !teamInfo?.isGlobalAdmin) return { totalValue: 0, activeCount: 0 };

    const whereClause: any = {};
    if (!teamInfo?.isGlobalAdmin) {
        whereClause.team_id = teamInfo?.teamId;
    }

    if (startDate && endDate) {
        whereClause.startDate = {
            gte: startDate,
            lte: endDate
        }
    }

    const contracts = await (prismadb.crm_Contracts as any).findMany({
        where: whereClause,
        select: {
            value: true,
            status: true
        }
    });

    const totalValue = contracts.reduce((acc: number, curr: any) => acc + (curr.value || 0), 0);
    const activeCount = contracts.filter((c: any) => c.status === "SIGNED" || c.status === "INPROGRESS").length;

    return {
        totalValue,
        activeCount,
        count: contracts.length
    };
};