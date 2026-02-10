import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

import { getCurrentUserTeamId } from "@/lib/team-utils";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const {
            object_id,
            name,
            apiName,
            type,
            isRequired,
            defaultValue,
            options,
            placeholder,
            helpText
        } = body;

        if (!object_id || !name || !apiName || !type) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Basic API Name validation
        const apiNameRegex = /^[a-z][a-z0-9_]*$/;
        if (!apiNameRegex.test(apiName)) {
            return new NextResponse("Invalid API Name format. Use lowercase and underscores only.", { status: 400 });
        }

        const teamInfo = await getCurrentUserTeamId();
        if (!teamInfo?.teamId) return new NextResponse("Forbidden", { status: 403 });

        // Verify object belongs to team
        const objectDef = await (prismadb as any).customObjectDefinition.findFirst({
            where: {
                id: object_id,
                team_id: teamInfo.teamId
            }
        });

        if (!objectDef) {
            return new NextResponse("Object not found or access denied", { status: 404 });
        }

        const existing = await (prismadb as any).customFieldDefinition.findFirst({
            where: {
                object_id,
                apiName,
                team_id: teamInfo.teamId
            },
        });

        if (existing) {
            return new NextResponse("Field with this API Name already exists on this object", { status: 409 });
        }

        // Get max order to append to end
        // Get max order to append to end
        const lastField = await (prismadb as any).customFieldDefinition.findFirst({
            where: {
                object_id,
                team_id: teamInfo.teamId
            },
            orderBy: { order: 'desc' }
        });
        const newOrder = (lastField?.order ?? 0) + 1;

        const newField = await (prismadb as any).customFieldDefinition.create({
            data: {
                object_id,
                name,
                apiName,
                type,
                isRequired: !!isRequired,
                defaultValue,
                options: options ?? undefined,
                placeholder,
                helpText,
                order: newOrder,
                team_id: teamInfo.teamId
            },
        });

        return NextResponse.json(newField);
    } catch (error) {
        console.error("[SCHEMA_FIELDS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
