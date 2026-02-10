"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getProducts() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return [];

        const products = await prismadb.crm_Products.findMany({
            where: {
                team_id: (session.user as any).team_id,
                active: true,
            },
            include: {
                bundles: {
                    include: {
                        childProduct: true
                    }
                }
            },
            orderBy: {
                name: "asc",
            },
        });

        return products;
    } catch (error) {
        console.error("[GET_PRODUCTS]", error);
        return [];
    }
}

export async function createProduct(data: {
    name: string;
    sku: string;
    description?: string;
    price: number;
    category?: string;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { success: false };

        await prismadb.crm_Products.create({
            data: {
                ...data,
                team_id: (session.user as any).team_id,
            },
        });

        revalidatePath("/crm/products");
        return { success: true };
    } catch (error) {
        console.error("[CREATE_PRODUCT]", error);
        return { success: false };
    }
}
