import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadbCrm } from "@/lib/prisma-crm";
import { prismadb } from "@/lib/prisma";
import { sendAssignmentNotification } from "@/lib/notifications/assignment-notify";

/**
 * POST /api/leads/pools/[poolId]/assign-member
 * Assigns a member to a lead pool
 */
export async function POST(
    req: Request,
    { params }: { params: { poolId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json(
                { error: "userId is required" },
                { status: 400 }
            );
        }

        // Check if user is admin
        const user = await prismadb.users.findUnique({
            where: { id: session.user.id },
            select: {
                name: true,
                is_admin: true,
                is_account_admin: true,
                assigned_role: { select: { name: true } },
                team_id: true,
            },
        });

        const isSuperAdmin = user?.assigned_role?.name === "SuperAdmin";
        const isAdmin = user?.is_admin || user?.is_account_admin;

        if (!isSuperAdmin && !isAdmin) {
            return NextResponse.json(
                { error: "Only admins can assign members to pools" },
                { status: 403 }
            );
        }

        // Get current pool
        const pool = await (prismadbCrm as any).crm_Lead_Pools.findUnique({
            where: { id: params.poolId },
            select: { id: true, assigned_members: true, name: true, description: true },
        });

        if (!pool) {
            return NextResponse.json(
                { error: "Pool not found" },
                { status: 404 }
            );
        }

        const currentMembers = pool.assigned_members || [];

        if (currentMembers.includes(userId)) {
            return NextResponse.json(
                { error: "Member already assigned to this pool" },
                { status: 400 }
            );
        }

        // Add member to pool
        await (prismadbCrm as any).crm_Lead_Pools.update({
            where: { id: params.poolId },
            data: {
                assigned_members: [...currentMembers, userId],
            },
        });

        // Fetch member details for notification
        const assignedMember = await prismadb.users.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true },
        });

        // Send notification (fire and forget)
        if (assignedMember?.email) {
            sendAssignmentNotification({
                memberEmail: assignedMember.email,
                memberName: assignedMember.name || "Team Member",
                memberId: assignedMember.id,
                senderId: session.user.id,
                teamId: user?.team_id || undefined,
                assignedByName: user?.name || "Admin",
                assignmentType: "pool",
                assignmentName: pool.name || "Lead Pool",
                assignmentId: params.poolId,
                role: "Member",
                description: pool.description || undefined,
            }).catch((err) => console.error("[NOTIFY] Pool assignment notification failed:", err));
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("[POOL_ASSIGN_MEMBER_POST]", error);
        return new NextResponse("Failed to assign member", { status: 500 });
    }
}

/**
 * DELETE /api/leads/pools/[poolId]/assign-member?userId=xxx
 * Removes a member from a lead pool
 */
export async function DELETE(
    req: Request,
    { params }: { params: { poolId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json(
                { error: "userId is required" },
                { status: 400 }
            );
        }

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
                { error: "Only admins can remove members from pools" },
                { status: 403 }
            );
        }

        // Get current pool
        const pool = await (prismadbCrm as any).crm_Lead_Pools.findUnique({
            where: { id: params.poolId },
            select: { id: true, assigned_members: true },
        });

        if (!pool) {
            return NextResponse.json(
                { error: "Pool not found" },
                { status: 404 }
            );
        }

        const currentMembers = pool.assigned_members || [];

        // Remove member from pool
        await (prismadbCrm as any).crm_Lead_Pools.update({
            where: { id: params.poolId },
            data: {
                assigned_members: currentMembers.filter((id: string) => id !== userId),
            },
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("[POOL_REMOVE_MEMBER_DELETE]", error);
        return new NextResponse("Failed to remove member", { status: 500 });
    }
}

/**
 * GET /api/leads/pools/[poolId]/assign-member
 * Gets assigned members for a pool
 */
export async function GET(
    req: Request,
    { params }: { params: { poolId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const pool = await (prismadbCrm as any).crm_Lead_Pools.findUnique({
            where: { id: params.poolId },
            select: { id: true, assigned_members: true },
        });

        if (!pool) {
            return NextResponse.json(
                { error: "Pool not found" },
                { status: 404 }
            );
        }

        const memberIds = pool.assigned_members || [];

        if (memberIds.length === 0) {
            return NextResponse.json({ members: [] }, { status: 200 });
        }

        // Get member details
        const members = await prismadb.users.findMany({
            where: { id: { in: memberIds } },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
            },
        });

        return NextResponse.json({ members }, { status: 200 });
    } catch (error) {
        console.error("[POOL_MEMBERS_GET]", error);
        return new NextResponse("Failed to fetch pool members", { status: 500 });
    }
}
