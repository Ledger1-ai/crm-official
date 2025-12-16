import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user with their assigned team
        const user = await prismadb.users.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                assigned_team: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                is_account_admin: true,
                is_admin: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            teamId: user.assigned_team?.id || null,
            teamName: user.assigned_team?.name || null,
            isAdmin: user.is_account_admin || user.is_admin || false,
        });
    } catch (error: any) {
        console.error("[GET /api/teams/my-team] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to get team" },
            { status: 500 }
        );
    }
}
