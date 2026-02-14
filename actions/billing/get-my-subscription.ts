"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Get the subscription for the current user's team.
 */
export async function getMyTeamSubscription() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return null;

        const user = await prismadb.users.findUnique({
            where: { id: session.user.id },
            select: { team_id: true }
        });

        if (!user?.team_id) return null;

        const sub = await prismadb.crm_Subscriptions.findUnique({
            where: { tenant_id: user.team_id },
            include: {
                team: {
                    select: { name: true, slug: true }
                }
            }
        });

        return sub;
    } catch (error) {
        console.error("[GET_MY_TEAM_SUBSCRIPTION]", error);
        return null;
    }
}
