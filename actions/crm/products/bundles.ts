"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateProductBundles(productId: string, bundles: { childProductId: string, quantity: number, isRequired: boolean }[]) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Unauthorized");

        // Simple approach: Delete existing and recreate
        await prismadb.crm_ProductBundles.deleteMany({
            where: {
                parentProductId: productId
            }
        });

        if (bundles.length > 0) {
            await prismadb.crm_ProductBundles.createMany({
                data: bundles.map(b => ({
                    parentProductId: productId,
                    childProductId: b.childProductId,
                    quantity: b.quantity,
                    isRequired: b.isRequired
                }))
            });
        }

        revalidatePath("/crm/products");
        return { success: true };
    } catch (error: any) {
        console.error("[UPDATE_PRODUCT_BUNDLES]", error);
        return { success: false, error: error.message };
    }
}
