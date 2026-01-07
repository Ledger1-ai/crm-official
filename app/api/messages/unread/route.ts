import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const count = await prismadb.internalMessageRecipient.count({
            where: {
                recipient_id: session.user.id,
                is_read: false,
                is_deleted: false,
                is_archived: false,
                recipient_type: { in: ["TO", "CC"] } // Count direct and CC messages
            }
        });

        return NextResponse.json({ count });
    } catch (error) {
        console.error("[MESSAGES_UNREAD_COUNT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
