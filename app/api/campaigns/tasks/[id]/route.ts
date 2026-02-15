import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);

    if (!session) {
        return new NextResponse("Unauthenticated", { status: 401 });
    }

    const { id } = params;

    if (!id) {
        return new NextResponse("Missing task id", { status: 400 });
    }

    try {
        const task = await prismadb.tasks.findUnique({
            where: {
                id: id,
            },
            include: {
                assigned_user: true,
                assigned_section: true,
            },
        });

        if (!task) {
            return new NextResponse("Task not found", { status: 404 });
        }

        return NextResponse.json(task);
    } catch (error) {
        console.log("[TASK_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
