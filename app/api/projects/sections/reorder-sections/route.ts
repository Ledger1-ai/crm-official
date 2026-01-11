
import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { list } = body;

    if (!session) {
        return new NextResponse("Unauthenticated", { status: 401 });
    }

    try {
        for (let i = 0; i < list.length; i++) {
            const section = list[i];
            await prismadb.sections.update({
                where: { id: section.id },
                data: {
                    position: i,
                },
            });
        }

        return NextResponse.json({ message: "Sections reordered successfully" });
    } catch (error) {
        console.log("[REORDER_SECTIONS]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
