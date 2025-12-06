"use server";

import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteCategory(categoryName: string) {
    if (!categoryName) throw new Error("Category name is required");

    try {
        const result = await prismadb.docArticle.deleteMany({
            where: {
                category: categoryName
            }
        });

        revalidatePath("/cms/docs");
        revalidatePath("/docs");

        return { success: true, count: result.count };
    } catch (error) {
        console.error("[DELETE_CATEGORY_ERROR]", error);
        throw new Error("Failed to delete category");
    }
}
