"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

export async function getDashboardLayout() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return null;
    }

    if (!prismadb.dashboardPreference) {
        console.warn("Prisma model 'dashboardPreference' not found. Run 'npx prisma generate' and restart server.");
        return null;
    }

    const preference = await prismadb.dashboardPreference.findUnique({
        where: {
            userId: session.user.id,
        },
    });

    return preference?.layout;
}
