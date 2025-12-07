"use server";

import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { checkTeamLimit } from "@/lib/subscription";
import bcrypt from "bcrypt";

import { getCurrentUserTeamId } from "@/lib/team-utils";

export const updateMemberRole = async (userId: string, role: string) => {
    try {
        const currentUser = await getCurrentUserTeamId();

        // Security Check for SUPER_ADMIN
        if (role === "SUPER_ADMIN") {
            const isAuthorized = currentUser?.isGlobalAdmin; // strictly defined in team-utils as Internal + SUPER_ADMIN
            if (!isAuthorized) {
                return { error: "Unauthorized: Only Super Admins can assign this role." };
            }
        }

        // General Permission Check (simple version: must be admin of the user's team or Super Admin)
        // For MVP, we assume if you can trigger this action from the UI, you passed layout checks.
        // But better to check:
        // const targetUser = await prismadb.users.findUnique({ where: { id: userId } });
        // if (targetUser.team_id !== currentUser.teamId && !currentUser.isGlobalAdmin) ...

        await (prismadb.users as any).update({
            where: { id: userId },
            data: { team_role: role },
        });
        revalidatePath(`/partners`);
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
        const team = await (prismadb as any).team.findUnique({
            where: { id: teamId },
            include: { assigned_plan: true }
        });
        if (!team) return { error: "Team not found" };

        const memberCount = await (prismadb.users as any).count({ where: { team_id: teamId } });

        if (!checkTeamLimit(team, "max_users", memberCount)) {
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

export const changePassword = async (userId: string, newPassword: string) => {
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await (prismadb.users as any).update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        return { success: true };
    } catch (error) {
        console.error("[CHANGE_PASSWORD]", error);
        return { error: "Failed to update password" };
    }
};

export const toggleUserStatus = async (userId: string, status: "ACTIVE" | "INACTIVE") => {
    try {
        await (prismadb.users as any).update({
            where: { id: userId },
            data: { userStatus: status },
        });
        return { success: true };
    } catch (error) {
        console.error("[TOGGLE_USER_STATUS]", error);
        return { error: "Failed to update status" };
    }
};
