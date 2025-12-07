"use server";

import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const updateTeamRenewal = async (
    teamId: string,
    renewalDate: Date | null
) => {
    try {
        await prismadb.team.update({
            where: {
                id: teamId,
            },
            data: {
                renewal_date: renewalDate,
            },
        });

        revalidatePath("/partners");
        return { success: "Renewal date updated" };
    } catch (error) {
        console.log("[UPDATE_TEAM_RENEWAL]", error);
        return { error: "Internal Error" };
    }
};
