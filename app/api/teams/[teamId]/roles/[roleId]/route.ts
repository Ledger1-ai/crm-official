import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

// PATCH /api/teams/[teamId]/roles/[roleId] - Update a custom role
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ teamId: string; roleId: string }> }
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
            return NextResponse.json({ error: "Only platform admins can update roles" }, { status: 403 });
        }

        const resolvedParams = await params;
        const { roleId } = resolvedParams;
        const body = await request.json();
        const { modules, name, description } = body;

        const role = await prismadb.customRole.update({
            where: { id: roleId },
            data: {
                ...(modules !== undefined && { modules }),
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description }),
            },
        });

        return NextResponse.json(role);
    } catch (error) {
        console.error("[TEAM_ROLE_PATCH]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/teams/[teamId]/roles/[roleId] - Delete a custom role
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ teamId: string; roleId: string }> }
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
            return NextResponse.json({ error: "Only platform admins can delete roles" }, { status: 403 });
        }

        const resolvedParams = await params;
        const { teamId, roleId } = resolvedParams;

        // Move users with this role back to default MEMBER role
        await prismadb.users.updateMany({
            where: { custom_role_id: roleId, team_id: teamId },
            data: { custom_role_id: null, team_role: "MEMBER" },
        });

        // Delete the role
        await prismadb.customRole.delete({
            where: { id: roleId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[TEAM_ROLE_DELETE]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
