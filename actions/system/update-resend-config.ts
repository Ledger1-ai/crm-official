"use server";

import { z } from "zod";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const updateSystemResendConfig = async (formData: FormData) => {
    const schema = z.object({
        id: z.string(),
        serviceKey: z.string(),
    });
    const parsed = schema.parse({
        id: formData.get("id"),
        serviceKey: formData.get("serviceKey"),
    });

    if (!parsed.id) {
        await prismadb.systemServices.create({
            data: {
                v: 0,
                name: "resend_smtp",
                serviceKey: parsed.serviceKey,
            },
        });
    } else {
        await prismadb.systemServices.update({
            where: {
                id: parsed.id,
            },
            data: {
                serviceKey: parsed.serviceKey,
            },
        });
    }

    // Revalidate checks
    revalidatePath("/admin/settings");
    revalidatePath("/partners"); // Revalidate broadly if needed
};
