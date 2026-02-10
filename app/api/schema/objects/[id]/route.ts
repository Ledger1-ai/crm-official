import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

import { getCurrentUserTeamId } from "@/lib/team-utils";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        if (!id) {
            return new NextResponse("Missing ID", { status: 400 });
        }

        const teamInfo = await getCurrentUserTeamId();
        if (!teamInfo?.teamId) return new NextResponse("Forbidden", { status: 403 });

        const objectDef = await (prismadb as any).customObjectDefinition.findFirst({
            where: {
                id: id,
                team_id: teamInfo.teamId
            },
            include: {
                fields: {
                    orderBy: {
                        order: "asc",
                    },
                },
            },
        });

        if (!objectDef) {
            return new NextResponse("Not Found", { status: 404 });
        }

        return NextResponse.json(objectDef);
    } catch (error) {
        console.error("[SCHEMA_OBJECT_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        const teamInfo = await getCurrentUserTeamId();
        if (!teamInfo?.teamId) return new NextResponse("Forbidden", { status: 403 });

        // Only allow Admins or higher to delete schema? 
        // For now assuming all authenticated users with access to this route are admins or authorized.

        // Check if system object
        const objectDef = await (prismadb as any).customObjectDefinition.findFirst({
            where: {
                id: id,
                team_id: teamInfo.teamId
            }
        });

        if (objectDef?.isSystem) {
            return new NextResponse("Cannot delete system objects", { status: 403 });
        }

        // Delete object (Cascade delete in Prisma schema handles fields and records)
        await (prismadb as any).customObjectDefinition.deleteMany({
            where: {
                id: id,
                team_id: teamInfo.teamId // Ensure ownership
            },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[SCHEMA_OBJECT_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
