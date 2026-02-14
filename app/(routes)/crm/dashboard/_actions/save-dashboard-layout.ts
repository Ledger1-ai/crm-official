"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

export async function saveDashboardLayout(layout: any[]) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const userId = session.user.id;

    try {
        await prismadb.dashboardPreference.upsert({
            where: {
                userId: userId,
            },
            update: {
                layout: layout,
            },
            create: {
                userId: userId,
                layout: layout,
            },
        });

        return { success: true };
    } catch (error) {
        console.error("[SAVE_DASHBOARD_LAYOUT]", error);
        throw new Error(`Internal Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}
