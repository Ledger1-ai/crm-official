import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

/**
 * GET /api/campaigns/my-assignments
 * Returns projects where the user is assigned as a ProjectMember
 */
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const memberships = await prismadb.projectMember.findMany({
            where: { user: session.user.id },
            include: {
                board: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        status: true,
                    },
                },
            },
            orderBy: { assignedAt: "desc" },
        });

        const projects = memberships.map((m: any) => ({
            id: m.board.id,
            title: m.board.title,
            description: m.board.description,
            status: m.board.status || "DRAFT",
            role: m.role,
            assignedAt: m.assignedAt?.toISOString(),
        }));

        return NextResponse.json({ projects }, { status: 200 });
    } catch (error) {
        console.error("[PROJECTS_MY_ASSIGNMENTS_GET]", error);
        return new NextResponse("Failed to fetch assignments", { status: 500 });
    }
}
