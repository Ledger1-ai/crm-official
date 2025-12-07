"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export const createTeam = async (name: string, slug: string, planId?: string) => {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return { error: "Unauthorized" };
        }

        // Check if slug exists
        const existing = await prismadb.team.findUnique({
            where: {
                slug
            }
        });

        if (existing) {
            return { error: "Team with this ID already exists" };
        }


        let renewalDate = null;
        if (planId) {
            const plan = await prismadb.plan.findUnique({ where: { id: planId } });
            if (plan) {
                const now = new Date();
                if (plan.billing_cycle === 'MONTHLY') {
                    renewalDate = new Date(now.setMonth(now.getMonth() + 1));
                } else if (plan.billing_cycle === 'YEARLY') {
                    renewalDate = new Date(now.setFullYear(now.getFullYear() + 1));
                }
            }
        }

        const team = await prismadb.team.create({
            data: {
                name,
                slug,
                plan_id: planId,
                renewal_date: renewalDate,
            },
        });

        revalidatePath("/partners");
        return { success: true, team };
    } catch (error) {
        console.error("[CREATE_TEAM]", error);
        return { error: "Internal Error" };
    }
};
