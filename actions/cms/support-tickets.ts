"use server";

import { prismadb } from "@/lib/prisma";

export async function getSupportTickets(limit = 20) {
    try {
        // @ts-ignore
        const tickets = await prismadb.supportTicket.findMany({
            take: limit,
            orderBy: {
                createdAt: "desc",
            }
        });
        return tickets;
    } catch (error) {
        console.error("Failed to fetch support tickets:", error);
        return [];
    }
}
