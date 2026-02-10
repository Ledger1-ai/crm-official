"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getNotifications() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return [];

        const notifications = await prismadb.notification.findMany({
            where: {
                userId: session.user.id,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 20,
        });

        return notifications;
    } catch (error) {
        console.error("[GET_NOTIFICATIONS]", error);
        return [];
    }
}

export async function markAsRead(notificationId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { success: false };

        await prismadb.notification.update({
            where: {
                id: notificationId,
                userId: session.user.id,
            },
            data: {
                isRead: true,
            },
        });

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("[MARK_NOTIFICATION_READ]", error);
        return { success: false };
    }
}

export async function markAllAsRead() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { success: false };

        await prismadb.notification.updateMany({
            where: {
                userId: session.user.id,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("[MARK_ALL_NOTIFICATIONS_READ]", error);
        return { success: false };
    }
}
