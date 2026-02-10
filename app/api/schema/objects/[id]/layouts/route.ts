import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

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

        const layouts = await (prismadb as any).pageLayout.findMany({
            where: { object_id: id },
            orderBy: { name: "asc" }
        });

        return NextResponse.json(layouts);
    } catch (error) {
        console.error("[LAYOUTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(
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
        const { name, sections, isDefault } = body;

        if (!name || !sections) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const newLayout = await (prismadb as any).pageLayout.create({
            data: {
                object_id: id,
                name,
                sections,
                isDefault: isDefault || false,
                createdBy: session.user.id
            },
        });

        return NextResponse.json(newLayout);
    } catch (error) {
        console.error("[LAYOUTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
