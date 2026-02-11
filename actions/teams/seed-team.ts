"use server";

import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const seedInternalTeam = async () => {
    try {
        // 1. Check if "BasaltHQ" exists
        let internalTeam = await prismadb.team.findUnique({
            where: {
                slug: "basalthq",
            },
        });

        // 2. Create if not exists
        if (!internalTeam) {
            internalTeam = await prismadb.team.create({
                data: {
                    name: "BasaltHQ",
                    slug: "basalthq",
                },
            });
        }

        // 3. Find all users WITHOUT a team
        // Note: Prisma MongoDB doesn't support complex "where" for nulls efficiently in all versions, 
        // but findMany({ where: { team_id: null } }) should work.
        // However, team_id might be undefined in old docs. 
        // Safer to fetch all and filter or updateMany.

        // updateMany is most efficient
        const result = await prismadb.users.updateMany({
            where: {
                team_id: {
                    isSet: false
                }
            },
            data: {
                team_id: internalTeam.id,
                team_role: "MEMBER"
            }
        });

        // Also catch nulls explicitly if field exists but is null
        await prismadb.users.updateMany({
            where: {
                team_id: null
            },
            data: {
                team_id: internalTeam.id,
                team_role: "MEMBER"
            }
        });

        revalidatePath("/partners");
        return { success: true, count: result.count, team: internalTeam };
    } catch (error) {
        console.error("[SEED_INTERNAL_TEAM]", error);
        return { error: "Failed to seed team" };
    }
};
