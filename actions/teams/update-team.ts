"use server";

import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// @ts-ignore
import { SubscriptionPlan } from "@prisma/client";

export const updateTeam = async (teamId: string, data: { name?: string; slug?: string; owner_id?: string; subscription_plan?: SubscriptionPlan; plan_id?: string; }) => {
    try {
        // Check slug uniqueness if changing
        if (data.slug) {
            const existing = await (prismadb as any).team.findFirst({
                where: {
                    slug: data.slug,
                    id: { not: teamId }
                }
            });
            if (existing) {
                return { error: "Slug already exists" };
            }
        }

        const team = await (prismadb as any).team.update({
            where: {
                id: teamId,
            },
            data: {
                ...data
            }
        });

        revalidatePath(`/partners/${teamId}`);
        revalidatePath("/partners");
        return { success: true, team };
    } catch (error) {
        console.error("[UPDATE_TEAM]", error);
        return { error: "Failed to update team" };
    }
};
