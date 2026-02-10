import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

import { getCurrentUserTeamId } from "@/lib/team-utils";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const teamInfo = await getCurrentUserTeamId();
        if (!teamInfo?.teamId) {
            return new NextResponse("Team ID not found", { status: 403 });
        }

        const objects = await (prismadb as any).customObjectDefinition.findMany({
            where: {
                team_id: teamInfo.teamId
            },
            orderBy: {
                name: "asc",
            },
            include: {
                fields: true, // Include fields metadata
                _count: {
                    select: { records: true },
                },
            },
        });

        return NextResponse.json(objects);
    } catch (error) {
        console.error("[SCHEMA_OBJECTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, pluralName, apiName, description, icon } = body;

        const teamInfo = await getCurrentUserTeamId();
        if (!teamInfo?.teamId) {
            return new NextResponse("Team ID not found", { status: 403 });
        }

        if (!name || !pluralName || !apiName) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Validate apiName format (pothole_case_c)
        // Basic regex: starts with letter, only letters/numbers/underscore
        const apiNameRegex = /^[a-z][a-z0-9_]*$/;
        if (!apiNameRegex.test(apiName)) {
            return new NextResponse("Invalid API Name format. Use lowercase and underscores only.", { status: 400 });
        }

        // Ensure suffix if strict Salesforce compliance is desired, but for now generic is fine.
        // Let's force lowercase for consistency
        const finalApiName = apiName.toLowerCase();

        const existing = await (prismadb as any).customObjectDefinition.findFirst({
            where: {
                apiName: finalApiName,
                team_id: teamInfo.teamId
            },
        });

        if (existing) {
            return new NextResponse("Object with this API Name already exists", { status: 409 });
        }

        const newObject = await (prismadb as any).customObjectDefinition.create({
            data: {
                name,
                pluralName,
                apiName: finalApiName,
                description,
                icon,
                createdBy: session.user.id,
                team_id: teamInfo.teamId
            },
        });

        return NextResponse.json(newObject);
    } catch (error) {
        console.error("[SCHEMA_OBJECTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
