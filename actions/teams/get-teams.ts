"use server";

import { prismadb } from "@/lib/prisma";

export const getTeams = async () => {
    try {
        const teams = await prismadb.team.findMany({
            orderBy: {
                created_at: "desc",
            },
            include: {
                members: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true
                    }
                }
            }
        });

        return teams;
    } catch (error) {
        console.error("[GET_TEAMS]", error);
        return [];
    }
};
