"use server";

import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const deleteTeam = async (teamId: string) => {
    try {
        // 1. Dissociate members first (Optional if Cascade/SetNull is handled by DB, but safe to do explicit)
        await prismadb.users.updateMany({
            where: { team_id: teamId },
            data: {
                team_id: null,
                team_role: "MEMBER"
            }
        });

        // 2. Delete the team
        await prismadb.team.delete({
            where: {
                id: teamId,
            },
        });

        // 3. Revalidate
        revalidatePath("/partners");

        return { success: true };
    } catch (error) {
        console.error("[DELETE_TEAM]", error);
        return { error: "Failed to delete team" };
    }
};
