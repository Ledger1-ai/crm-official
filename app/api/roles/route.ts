import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { z } from "zod";

const createRoleSchema = z.object({
    name: z.string().min(1).max(50),
    description: z.string().optional(),
    modules: z.array(z.string()),
    teamId: z.string(),
});

// POST - Create a new custom role
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, description, modules, teamId } = createRoleSchema.parse(body);

        // Verify user is admin of the team
        const user = await prismadb.users.findFirst({
            where: {
                email: session.user.email,
                team_id: teamId,
                OR: [
                    { team_role: "ADMIN" },
                    { team_role: "OWNER" },
                    { is_admin: true },
                ],
            },
        });

        if (!user) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Create the role
        const role = await prismadb.customRole.create({
            data: {
                name,
                description,
                modules,
                team_id: teamId,
            },
        });

        return NextResponse.json(role, { status: 201 });
    } catch (error) {
        console.error("[ROLES_POST]", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// GET - Get all custom roles for a team
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const teamId = searchParams.get("teamId");

        if (!teamId) {
            return NextResponse.json({ error: "teamId required" }, { status: 400 });
        }

        // Verify user is part of the team
        const user = await prismadb.users.findFirst({
            where: {
                email: session.user.email,
                team_id: teamId,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const roles = await prismadb.customRole.findMany({
            where: { team_id: teamId },
            include: {
                _count: {
                    select: { users: true },
                },
            },
            orderBy: { created_at: "asc" },
        });

        return NextResponse.json(roles);
    } catch (error) {
        console.error("[ROLES_GET]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
