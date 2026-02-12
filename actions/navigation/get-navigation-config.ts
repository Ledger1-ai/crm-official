"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getNavigationConfig() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return null;
    }

    const userId = session.user.id;

    // Try to get teamId from session, fallback to DB
    let teamId = (session.user as any).teamId;

    if (!teamId) {
        const user = await prismadb.users.findUnique({
            where: { id: userId },
            select: { team_id: true }
        });
        teamId = user?.team_id;
    }

    if (!teamId) return null;

    // Priority 1: User-Specific Override
    const userConfig = await (prismadb as any).navigationConfig?.findFirst({
        where: {
            team_id: teamId,
            user_id: userId
        }
    });

    if (userConfig?.structure) {
        return userConfig.structure;
    }

    // Priority 2: Team-Wide Default
    const teamConfig = await (prismadb as any).navigationConfig?.findFirst({
        where: {
            team_id: teamId,
            user_id: null // Explicitly look for the config with NO user_id
        }
    });

    if (teamConfig?.structure) {
        return teamConfig.structure;
    }

    // Priority 3: System Default (Code)
    return null;
}
