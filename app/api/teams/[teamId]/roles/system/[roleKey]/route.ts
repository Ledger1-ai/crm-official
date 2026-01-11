import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

// PATCH /api/teams/[teamId]/roles/system/[roleKey] - Update system role module defaults for a team
// Note: This updates the assigned_modules for all users with this role in the team
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ teamId: string; roleKey: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is a global admin (platform owner)
        const currentUser = await prismadb.users.findUnique({
            where: { email: session.user.email },
            select: { team_role: true, assigned_team: { select: { slug: true } } },
        });

        const isGlobalAdmin = currentUser?.assigned_team?.slug === "ledger1" && currentUser?.team_role === "SUPER_ADMIN";
        if (!isGlobalAdmin) {
            return NextResponse.json({ error: "Only platform admins can update system roles" }, { status: 403 });
        }

        const resolvedParams = await params;
        const { teamId, roleKey } = resolvedParams;
        const body = await request.json();
        const { modules } = body;

        if (!["ADMIN", "MEMBER", "VIEWER"].includes(roleKey)) {
            return NextResponse.json({ error: "Invalid system role" }, { status: 400 });
        }

        // Update assigned_modules for all users with this role in the team
        await prismadb.users.updateMany({
            where: {
                team_id: teamId,
                team_role: roleKey,
            },
            data: { assigned_modules: modules || [] },
        });

        return NextResponse.json({ success: true, roleKey, modules });
    } catch (error) {
        console.error("[TEAM_SYSTEM_ROLE_PATCH]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
