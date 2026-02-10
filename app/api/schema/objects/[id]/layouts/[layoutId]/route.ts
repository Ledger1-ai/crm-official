import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string, layoutId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { layoutId } = await params;

        const layout = await (prismadb as any).pageLayout.findUnique({
            where: { id: layoutId }
        });

        if (!layout) {
            return new NextResponse("Not Found", { status: 404 });
        }

        return NextResponse.json(layout);
    } catch (error) {
        console.error("[LAYOUT_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string, layoutId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id, layoutId } = await params;
        const body = await req.json();
        const { name, sections, isDefault } = body;

        // reset other defaults if this is set to true
        if (isDefault) {
            await (prismadb as any).pageLayout.updateMany({
                where: { object_id: id },
                data: { isDefault: false }
            });
        }

        const updated = await (prismadb as any).pageLayout.update({
            where: { id: layoutId },
            data: {
                name,
                sections,
                isDefault
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("[LAYOUT_UPDATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string, layoutId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { layoutId } = await params;

        await (prismadb as any).pageLayout.delete({
            where: { id: layoutId }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[LAYOUT_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
