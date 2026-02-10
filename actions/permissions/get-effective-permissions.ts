"use server";

import { prismadb } from "@/lib/prisma";
import { ROLE_CONFIGS, TeamRole } from "@/lib/role-permissions";

export async function getEffectiveRoleModules(teamId: string, role: string, scope: string) {
    try {
        // Check if rolePermission exists (bypassing TS type check which might be stale)
        if (!(prismadb as any).rolePermission) {
            console.error("FATAL: prismadb.rolePermission is undefined!");
            console.error("Prisma Keys:", Object.keys(prismadb));
            return [];
        }

        const permission = await (prismadb as any).rolePermission.findUnique({
            where: {
                team_id_role_scope: {
                    team_id: teamId,
                    role,
                    scope
                }
            }
        });

        if (permission) {
            return permission.modules;
        }

        // Fallback to defaults
        // Note: For SUPER_ADMIN, defaults are usually ALL, but this function is mainly for configurable roles.
        // If role doesn't exist in ROLE_CONFIGS (e.g. SUPER_ADMIN), return empty or handle?
        // ROLE_CONFIGS excludes SUPER_ADMIN keys.

        if (role === 'SUPER_ADMIN' || role === 'PLATFORM_ADMIN' || role === 'PLATFORM ADMIN') return ['*'];

        const config = ROLE_CONFIGS[role as Exclude<TeamRole, 'SUPER_ADMIN'>];
        return config ? config.defaultModules : [];

    } catch (error) {
        console.error("Failed to fetch effective permissions:", error);
        if (role === 'SUPER_ADMIN' || role === 'PLATFORM_ADMIN' || role === 'PLATFORM ADMIN') return ['*'];
        const config = ROLE_CONFIGS[role as Exclude<TeamRole, 'SUPER_ADMIN'>];
        return config ? config.defaultModules : [];
    }
}
