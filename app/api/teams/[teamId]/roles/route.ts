import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

// GET /api/teams/[teamId]/roles - Get all roles for a team
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ teamId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const { teamId } = resolvedParams;

        const roles = await prismadb.customRole.findMany({
            where: { team_id: teamId },
            include: { _count: { select: { users: true } } },
            orderBy: { created_at: "asc" },
        });

        return NextResponse.json(roles);
    } catch (error) {
        console.error("[TEAM_ROLES_GET]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/teams/[teamId]/roles - Create a new custom role
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ teamId: string }> }
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
            return NextResponse.json({ error: "Only platform admins can create roles" }, { status: 403 });
        }

        const resolvedParams = await params;
        const { teamId } = resolvedParams;
        const body = await request.json();
        const { name, description, modules } = body;

        if (!name?.trim()) {
            return NextResponse.json({ error: "Role name is required" }, { status: 400 });
        }

        // Check if role name already exists for this team
        const existingRole = await prismadb.customRole.findFirst({
            where: { team_id: teamId, name: name.trim() },
        });

        if (existingRole) {
            return NextResponse.json({ error: "A role with this name already exists" }, { status: 400 });
        }

        const role = await prismadb.customRole.create({
            data: {
                name: name.trim(),
                description: description || null,
                modules: modules || [],
                team_id: teamId,
            },
        });

        return NextResponse.json(role, { status: 201 });
    } catch (error) {
        console.error("[TEAM_ROLES_POST]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
