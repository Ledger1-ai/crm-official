"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateTeamStatus(
    teamId: string,
    status: "ACTIVE" | "PENDING" | "SUSPENDED",
    reason?: string
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: "Unauthorized" };

    const user = await prismadb.users.findUnique({
        where: { id: session.user.id },
        include: { assigned_team: true }
    }) as any;

    const isInternalAdmin = user?.assigned_team?.slug === "ledger1" && (user.team_role === "SUPER_ADMIN" || user.team_role === "OWNER");

    if (!isInternalAdmin && !user?.is_admin) {
        return { error: "Forbidden: Only internal admins can update team status." };
    }

    try {
        await prismadb.team.update({
            where: { id: teamId },
            data: {
                status: status,
                suspension_reason: status === "SUSPENDED" ? reason : null
            }
        });

        revalidatePath("/partners");
        revalidatePath(`/partners/${teamId}`);
        return { success: `Team status updated to ${status}` };
    } catch (error) {
        console.error("Update Team Status Error:", error);
        return { error: "Failed to update team status" };
    }
}
