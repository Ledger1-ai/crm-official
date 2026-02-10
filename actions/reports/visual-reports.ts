"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { REPORTABLE_OBJECTS } from "@/lib/reports-config";

export async function runVisualReport(config: {
    objectType: string;
    fields: string[];
    filters: { field: string; operator: string; value: string }[];
    chartType: string;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Unauthorized");

        const targetObject = REPORTABLE_OBJECTS.find(o => o.id === config.objectType);
        if (!targetObject) throw new Error("Invalid object type");

        const teamId = (session.user as any).team_id;

        // Build Prisma where clause
        const where: any = {
            team_id: teamId
        };

        config.filters.forEach(filter => {
            if (filter.operator === "equals") {
                where[filter.field] = filter.value;
            } else if (filter.operator === "contains") {
                where[filter.field] = { contains: filter.value, mode: 'insensitive' };
            } else if (filter.operator === "gt") {
                where[filter.field] = { gt: isNaN(Number(filter.value)) ? filter.value : Number(filter.value) };
            } else if (filter.operator === "lt") {
                where[filter.field] = { lt: isNaN(Number(filter.value)) ? filter.value : Number(filter.value) };
            } else if (filter.operator === "not_empty") {
                where[filter.field] = { not: null };
            }
        });

        // Prisma model access
        const model = (prismadb as any)[targetObject.modelName];
        if (!model) throw new Error(`Model ${targetObject.modelName} not found`);

        const data = await model.findMany({
            where,
            select: config.fields.reduce((acc, f) => ({ ...acc, [f]: true }), { id: true }),
            take: 100, // Limit for live preview
            orderBy: { createdAt: 'desc' }
        });

        return { success: true, data };
    } catch (error: any) {
        console.error("[RUN_VISUAL_REPORT]", error);
        return { success: false, error: error.message };
    }
}

export async function saveVisualReport(config: {
    title: string;
    objectType: string;
    fields: string[];
    filters: any;
    chartType: string;
    content: string; // Serialized preview or summary
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Unauthorized");

        const report = await prismadb.savedReport.create({
            data: {
                title: config.title,
                type: "VISUAL_REPORT",
                content: config.content,
                filters: {
                    objectType: config.objectType,
                    fields: config.fields,
                    filters: config.filters,
                    chartType: config.chartType
                },
                userId: session.user.id,
                teamId: (session.user as any).team_id
            }
        });

        return { success: true, reportId: report.id };
    } catch (error: any) {
        console.error("[SAVE_VISUAL_REPORT]", error);
        return { success: false, error: error.message };
    }
}
