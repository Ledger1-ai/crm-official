"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getQuotes() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return [];

        const quotes = await prismadb.crm_Quotes.findMany({
            where: {
                team_id: (session.user as any).team_id,
            },
            include: {
                account: true,
                contact: true,
                items: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return quotes;
    } catch (error) {
        console.error("[GET_QUOTES]", error);
        return [];
    }
}

export async function createQuote(data: {
    title: string;
    accountId?: string;
    contactId?: string;
    opportunityId?: string;
    items: {
        productId: string;
        quantity: number;
        unitPrice: number;
        discount: number;
        totalPrice: number;
    }[];
    totalAmount: number;
    expirationDate?: Date;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Unauthorized");

        const quoteNumber = `Q-${Math.floor(100000 + Math.random() * 900000)}`;

        const quote = await prismadb.crm_Quotes.create({
            data: {
                title: data.title,
                quoteNumber,
                status: "DRAFT",
                totalAmount: data.totalAmount,
                expirationDate: data.expirationDate,
                accountId: data.accountId,
                contactId: data.contactId,
                opportunityId: data.opportunityId,
                createdBy: session.user.id,
                team_id: (session.user as any).team_id,
                items: {
                    create: data.items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        discount: item.discount,
                        totalPrice: item.totalPrice
                    }))
                }
            }
        });

        revalidatePath("/crm/quotes");
        return { success: true, quoteId: quote.id };
    } catch (error: any) {
        console.error("[CREATE_QUOTE]", error);
        return { success: false, error: error.message };
    }
}

export async function getQuoteById(id: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return null;

        const quote = await prismadb.crm_Quotes.findFirst({
            where: {
                id,
                team_id: (session.user as any).team_id,
            },
            include: {
                account: true,
                contact: true,
                opportunity: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        return quote;
    } catch (error) {
        console.error("[GET_QUOTE_BY_ID]", error);
        return null;
    }
}
