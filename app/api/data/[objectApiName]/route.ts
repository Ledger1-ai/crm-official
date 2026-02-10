import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

import { getCurrentUserTeamId } from "@/lib/team-utils";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ objectApiName: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { objectApiName } = await params;

        const teamInfo = await getCurrentUserTeamId();
        if (!teamInfo?.teamId) return new NextResponse("Forbidden", { status: 403 });

        const objectDef = await (prismadb as any).customObjectDefinition.findFirst({
            where: {
                apiName: objectApiName,
                team_id: teamInfo.teamId
            },
            include: { fields: true }
        });

        if (!objectDef) {
            return new NextResponse("Object not found", { status: 404 });
        }

        const records = await (prismadb as any).customRecord.findMany({
            where: { object_id: objectDef.id }, // ID is unique so this is safe, but object belongs to team
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(records);
    } catch (error) {
        console.error("[DATA_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ objectApiName: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { objectApiName } = await params;
        const body = await req.json();

        const teamInfo = await getCurrentUserTeamId();
        if (!teamInfo?.teamId) return new NextResponse("Forbidden", { status: 403 });

        const objectDef = await (prismadb as any).customObjectDefinition.findFirst({
            where: {
                apiName: objectApiName,
                team_id: teamInfo.teamId
            },
            include: { fields: true }
        });

        if (!objectDef) {
            return new NextResponse("Object not found", { status: 404 });
        }

        // Basic Validation
        const errors: string[] = [];
        objectDef.fields.forEach((field: any) => {
            if (field.isRequired && (body[field.apiName] === undefined || body[field.apiName] === null || body[field.apiName] === "")) {
                errors.push(`Field '${field.name}' is required.`);
            }
        });

        if (errors.length > 0) {
            return new NextResponse(errors.join(", "), { status: 400 });
        }

        // Determine "Name" field (first text field? or 'name' property if passes?)
        // For now, let's look for a field with apiName 'name' or just use the first text field or the ID
        let recordName = body['name'] || "New Record";

        // If there is a field that is 'isUnique' we should check it, but saving that for later for speed.

        const newRecord = await (prismadb as any).customRecord.create({
            data: {
                object_id: objectDef.id,
                data: body,
                name: String(recordName),
                createdBy: session.user.id,
                team_id: teamInfo.teamId
            },
        });

        return NextResponse.json(newRecord);
    } catch (error) {
        console.error("[DATA_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
