
"use server";

import { prismadb } from "@/lib/prisma";

export const getInvoiceActivity = async (invoiceId: string) => {
    try {
        const activities = await prismadb.systemActivity.findMany({
            where: {
                resource: {
                    contains: invoiceId
                }
            },
            include: {
                user: {
                    select: {
                        name: true,
                        avatar: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return activities.map(a => ({
            id: a.id,
            user: a.user?.name || "System",
            action: a.action,
            details: a.details,
            timestamp: a.createdAt,
        }));
    } catch (error) {
        console.error("Error fetching invoice activity:", error);
        return [];
    }
};
