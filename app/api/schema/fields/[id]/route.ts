import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { name, isRequired, isUnique, options, order, listColumn } = body;

        const field = await prismadb.customFieldDefinition.update({
            where: {
                id: id,
            },
            data: {
                name,
                isRequired,
                isUnique,
                options: options ?? undefined,
                order,
                listColumn
            },
        });

        return NextResponse.json(field);
    } catch (error) {
        console.error("[SCHEMA_FIELD_UPDATE]", error);
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

        await prismadb.customFieldDefinition.delete({
            where: {
                id: id,
            },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[SCHEMA_FIELD_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
