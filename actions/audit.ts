"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function logActivityInternal(
    userId: string,
    action: string,
    resource: string,
    details?: string
) {
    try {
        await prismadb.systemActivity.create({
            data: {
                userId,
                action,
                resource,
                details,
            },
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
    }
}

export async function logActivity(
    action: string,
    resource: string,
    details?: string
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return;

        await logActivityInternal(session.user.id, action, resource, details);
    } catch (error) {
        console.error("Failed to log activity:", error);
    }
}

export async function getRecentActivities(limit = 50) {
    try {
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        const activities = await prismadb.systemActivity.findMany({
            where: {
                createdAt: {
                    gte: twoWeeksAgo
                }
            },
            take: limit,
            orderBy: {
                createdAt: "desc",
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
        });

        return activities;
    } catch (error) {
        console.error("Failed to fetch activities:", error);
        return [];
    }
}
