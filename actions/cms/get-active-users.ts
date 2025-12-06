"use server";

import { prismadb } from "@/lib/prisma";

export async function getActiveUsers() {
    try {
        // Fetch users sorted by lastLoginAt (descending)
        // Taking top 20 for the "Active Now" view
        const users = await prismadb.users.findMany({
            orderBy: {
                lastLoginAt: 'desc',
            },
            take: 20,
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                lastLoginAt: true,
                is_admin: true
            }
        });

        return users;
    } catch (error) {
        console.error("Failed to fetch active users", error);
        return [];
    }
}
