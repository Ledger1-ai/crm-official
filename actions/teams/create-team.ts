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

        const team = await prismadb.team.create({
            data: {
                name,
                slug,
                plan_id: planId,
            },
        });

        revalidatePath("/partners");
        return { success: true, team };
    } catch (error) {
        console.error("[CREATE_TEAM]", error);
        return { error: "Internal Error" };
    }
};
