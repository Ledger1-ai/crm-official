import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { sendAssignmentNotification } from "@/lib/notifications/assignment-notify";

/**
 * GET /api/projects/[projectId]/members
 * Returns all members assigned to a project
 */
export async function GET(
    req: Request,
    { params }: { params: { projectId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const members = await prismadb.projectMember.findMany({
            where: { project: params.projectId },
            include: {
                member: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
            orderBy: { assignedAt: "desc" },
        });

        const result = members.map((m: any) => ({
            id: m.id,
            user: m.user,
            role: m.role,
            assignedAt: m.assignedAt?.toISOString(),
            member: m.member,
        }));

        return NextResponse.json({ members: result }, { status: 200 });
    } catch (error) {
        console.error("[PROJECT_MEMBERS_GET]", error);
        return new NextResponse("Failed to fetch project members", { status: 500 });
    }
}

/**
 * POST /api/projects/[projectId]/members
 * Assigns a user to a project
 */
export async function POST(
    req: Request,
    { params }: { params: { projectId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { userId, role } = await req.json();

        if (!userId) {
            return NextResponse.json(
                { error: "userId is required" },
                { status: 400 }
            );
        }

        // Check if user is admin
        const currentUser = await prismadb.users.findUnique({
            where: { id: session.user.id },
            select: {
                name: true,
                is_admin: true,
                is_account_admin: true,
                assigned_role: { select: { name: true } },
                team_id: true,
            },
        });

        const isSuperAdmin = currentUser?.assigned_role?.name === "SuperAdmin";
        const isAdmin = currentUser?.is_admin || currentUser?.is_account_admin;

        if (!isSuperAdmin && !isAdmin) {
            return NextResponse.json(
                { error: "Only admins can assign members" },
                { status: 403 }
            );
        }

        // Check if already assigned
        const existing = await prismadb.projectMember.findFirst({
            where: {
                project: params.projectId,
                user: userId,
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: "User already assigned to this project" },
                { status: 400 }
            );
        }

        // Get project details for notification
        const project = await prismadb.boards.findUnique({
            where: { id: params.projectId },
            select: { title: true, description: true },
        });

        // Create membership
        const membership = await prismadb.projectMember.create({
            data: {
                project: params.projectId,
                user: userId,
                role: role || "MEMBER",
                assignedBy: session.user.id,
            },
            include: {
                member: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
        });

        const assignedMember = (membership as any).member;

        // Send email notification (fire and forget - don't block on failure)
        if (assignedMember?.email) {
            sendAssignmentNotification({
                memberEmail: assignedMember.email,
                memberName: assignedMember.name || "Team Member",
                memberId: assignedMember.id,
                senderId: session.user.id,
                teamId: currentUser?.team_id || undefined, // from session user
                assignedByName: currentUser?.name || "Admin",
                assignmentType: "project",
                assignmentName: project?.title || "Project",
                assignmentId: params.projectId,
                role: role || "MEMBER",
                description: project?.description || undefined,
            }).catch((err) => console.error("[NOTIFY] Project assignment email failed:", err));
        }

        const result = {
            id: membership.id,
            user: membership.user,
            role: membership.role,
            assignedAt: membership.assignedAt?.toISOString(),
            member: assignedMember,
        };

        return NextResponse.json({ member: result }, { status: 201 });
    } catch (error) {
        console.error("[PROJECT_MEMBERS_POST]", error);
        return new NextResponse("Failed to assign member", { status: 500 });
    }
}

