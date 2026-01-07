import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

/**
 * DELETE /api/projects/[projectId]/members/[memberId]
 * Removes a member from a project
 */
export async function DELETE(
    req: Request,
    { params }: { params: { projectId: string; memberId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        // Check if user is admin
        const user = await prismadb.users.findUnique({
            where: { id: session.user.id },
            select: {
                is_admin: true,
                is_account_admin: true,
                assigned_role: { select: { name: true } },
            },
        });

        const isSuperAdmin = user?.assigned_role?.name === "SuperAdmin";
        const isAdmin = user?.is_admin || user?.is_account_admin;

        if (!isSuperAdmin && !isAdmin) {
            return NextResponse.json(
                { error: "Only admins can remove members" },
                { status: 403 }
            );
        }

        // Verify membership exists
        const membership = await prismadb.projectMember.findFirst({
            where: {
                id: params.memberId,
                project: params.projectId,
            },
        });

        if (!membership) {
            return NextResponse.json(
                { error: "Membership not found" },
                { status: 404 }
            );
        }

        // Delete membership
        await prismadb.projectMember.delete({
            where: { id: params.memberId },
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("[PROJECT_MEMBER_DELETE]", error);
        return new NextResponse("Failed to remove member", { status: 500 });
    }
}
