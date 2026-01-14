
"use server";

import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const updateModelPricing = async (formData: FormData) => {
    const id = formData.get("id") as string;
    const inputPrice = parseFloat(formData.get("inputPrice") as string);
    const outputPrice = parseFloat(formData.get("outputPrice") as string);
    const isActive = formData.get("isActive") === "on";
    const isDefault = formData.get("isDefault") === "on";

    const defaultMarkup = parseFloat(formData.get("defaultMarkup") as string);
    const maxContext = parseInt(formData.get("maxContext") as string);

    if (isDefault) {
        // Unset other defaults if this one is being set to true
        // We need to know the provider to unset defaults only for that provider? 
        // Logic in original file was global? 
        // Original: `where: { isDefault: true }`. This unsets defaults GLOBALLY. 
        // This seems wrong if we want defaults per provider. 
        // But let's stick to the original logic for now or improve it?
        // Since we added `provider` logic for defaults elsewhere, let's look up the model first.

        const model = await prismadb.aiModel.findUnique({ where: { id } });
        if (model) {
            await prismadb.aiModel.updateMany({
                where: { provider: model.provider, isDefault: true },
                data: { isDefault: false }
            });
        }
    }

    await prismadb.aiModel.update({
        where: { id },
        data: {
            inputPrice,
            outputPrice,
            defaultMarkup,
            maxContext,
            isActive,
            isDefault
        }
    });

    revalidatePath("/partners/ai-pricing");
    revalidatePath("/admin/ai-setup");
    revalidatePath("/partners/ai-system-config");
};
