"use server";

import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { checkLimit } from "@/lib/subscription";

export const updateMemberRole = async (userId: string, role: string) => {
    try {
        await (prismadb.users as any).update({
            where: { id: userId },
            data: { team_role: role },
        });
        return { success: true };
    } catch (error) {
        console.error("[UPDATE_MEMBER_ROLE]", error);
        return { error: "Failed to update role" };
    }
};

export const removeMember = async (userId: string) => {
    try {
        await (prismadb.users as any).update({
            where: { id: userId },
            data: {
                team_id: null,
                team_role: "MEMBER" // Reset role
            },
        });
        return { success: true };
    } catch (error) {
        console.error("[REMOVE_MEMBER]", error);
        return { error: "Failed to remove member" };
    }
};

export const searchUsers = async (query: string) => {
    try {
        const users = await (prismadb.users as any).findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { email: { contains: query, mode: "insensitive" } }
                ],
                // AND: { team_id: null } // Optional: only show unassigned? Or all and let the UI handle moving?
                // For now allow stealing users from other teams (Admin power) or unassigned.
            },
            take: 5,
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                team_id: true
            }
        });
        return users;
    } catch (error) {
        return [];
    }
}

export const addMember = async (teamId: string, userId: string) => {
    try {
        const team = await (prismadb as any).team.findUnique({ where: { id: teamId } });
        if (!team) return { error: "Team not found" };

        const memberCount = await (prismadb.users as any).count({ where: { team_id: teamId } });

        if (!checkLimit(team.subscription_plan as any, "max_users", memberCount)) {
            return { error: "Team member limit reached. Upgrade your plan." };
        }

        await (prismadb.users as any).update({
            where: { id: userId },
            data: {
                team_id: teamId,
                team_role: "MEMBER"
            }
        });
        revalidatePath(`/partners/${teamId}`);
        return { success: true };
    } catch (error) {
        return { error: "Failed to add member" };
    }
}
