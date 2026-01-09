import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { z } from "zod";

const updateRoleSchema = z.object({
    name: z.string().min(1).max(50).optional(),
    description: z.string().optional(),
    modules: z.array(z.string()).optional(),
});

// PUT - Update a custom role
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const roleId = params.id;
        const body = await req.json();
        const data = updateRoleSchema.parse(body);

        // Get the role to verify team membership
        const existingRole = await prismadb.customRole.findUnique({
            where: { id: roleId },
        });

        if (!existingRole) {
            return NextResponse.json({ error: "Role not found" }, { status: 404 });
        }

        // Verify user is admin of the team
        const user = await prismadb.users.findFirst({
            where: {
                email: session.user.email,
                team_id: existingRole.team_id,
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

        const role = await prismadb.customRole.update({
            where: { id: roleId },
            data,
        });

        return NextResponse.json(role);
    } catch (error) {
        console.error("[ROLE_PUT]", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// DELETE - Delete a custom role
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const roleId = params.id;

        // Get the role to verify team membership
        const existingRole = await prismadb.customRole.findUnique({
            where: { id: roleId },
        });

        if (!existingRole) {
            return NextResponse.json({ error: "Role not found" }, { status: 404 });
        }

        // Verify user is admin of the team
        const user = await prismadb.users.findFirst({
            where: {
                email: session.user.email,
                team_id: existingRole.team_id,
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

        // Remove role assignment from users first
        await prismadb.users.updateMany({
            where: { custom_role_id: roleId },
            data: { custom_role_id: null },
        });

        // Delete the role
        await prismadb.customRole.delete({
            where: { id: roleId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[ROLE_DELETE]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
