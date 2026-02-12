"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function updateTeamNavigationConfig(structure: any) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const userId = session.user.id;
    const user = await prismadb.users.findUnique({
        where: { id: userId },
        select: { team_id: true, team_role: true, is_admin: true }
    });

    if (!user || !user.team_id) throw new Error("Team not found");

    const isAdmin = user.is_admin || ["ADMIN", "SUPER_ADMIN", "OWNER", "PLATFORM_ADMIN"].includes((user.team_role || "").toUpperCase());
    if (!isAdmin) throw new Error("Permission Denied: Only Admins can update Team Navigation.");

    // Check if existing TEAM config exists (user_id: null)
    const existing = await (prismadb as any).navigationConfig?.findFirst({
        where: { team_id: user.team_id, user_id: null }
    });

    if (existing) {
        return await (prismadb as any).navigationConfig?.update({
            where: { id: existing.id },
            data: { structure }
        });
    } else {
        return await (prismadb as any).navigationConfig?.create({
            data: {
                team_id: user.team_id,
                user_id: null,
                structure
            }
        });
    }
}

export async function updateUserNavigationConfig(structure: any) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const userId = session.user.id;
    const user = await prismadb.users.findUnique({
        where: { id: userId },
        select: { team_id: true }
    });

    if (!user || !user.team_id) throw new Error("Team not found");

    // Check if existing USER config exists
    const existing = await (prismadb as any).navigationConfig?.findFirst({
        where: { team_id: user.team_id, user_id: userId }
    });

    if (existing) {
        return await (prismadb as any).navigationConfig?.update({
            where: { id: existing.id },
            data: { structure }
        });
    } else {
        return await (prismadb as any).navigationConfig?.create({
            data: {
                team_id: user.team_id,
                user_id: userId,
                structure
            }
        });
    }
}

export async function resetNavigationConfig(scope: "USER" | "TEAM") {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const userId = session.user.id;
    const user = await prismadb.users.findUnique({
        where: { id: userId },
        select: { team_id: true, team_role: true, is_admin: true }
    });

    if (!user || !user.team_id) throw new Error("Team not found");

    if (scope === "USER") {
        // Delete only THIS user's override
        await (prismadb as any).navigationConfig?.deleteMany({
            where: { team_id: user.team_id, user_id: userId }
        });
    } else if (scope === "TEAM") {
        const isAdmin = user.is_admin || ["ADMIN", "SUPER_ADMIN", "OWNER", "PLATFORM_ADMIN"].includes((user.team_role || "").toUpperCase());
        if (!isAdmin) throw new Error("Permission Denied");

        // Delete TEAM config (user_id: null)
        await (prismadb as any).navigationConfig?.deleteMany({
            where: { team_id: user.team_id, user_id: null } // Prisma treats null as explicit value
        });
        // TODO: Does this deleteMany also delete users' overrides? NO.
        // Should resetting Team config delete user overrides? Probably not.
    }

    return { success: true };
}
