import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const teamId = (session.user as any).team_id;

        if (!teamId) {
            return NextResponse.json({ error: "No team associated" }, { status: 400 });
        }

        const messages = await prismadb.internalMessage.findMany({
            where: {
                OR: [
                    { sender_id: userId },
                    { recipients: { some: { recipient_id: userId } } },
                ],
                team_id: teamId,
            },
            include: {
                recipients: true,
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        });

        return NextResponse.json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const teamId = (session.user as any).team_id;

        if (!teamId) {
            return NextResponse.json({ error: "No team associated" }, { status: 400 });
        }

        const body = await req.json();
        const { recipient_ids, subject, body_text, body_html, priority, labels } = body;

        if (!recipient_ids || recipient_ids.length === 0) {
            return NextResponse.json({ error: "At least one recipient required" }, { status: 400 });
        }

        if (!subject) {
            return NextResponse.json({ error: "Subject required" }, { status: 400 });
        }

        // Get sender info
        const sender = await prismadb.users.findUnique({
            where: { id: userId },
            select: { name: true, email: true },
        });

        // Create the message
        const message = await prismadb.internalMessage.create({
            data: {
                sender_id: userId,
                sender_name: sender?.name,
                sender_email: sender?.email,
                subject,
                body_text,
                body_html,
                status: "SENT",
                priority: priority || "NORMAL",
                labels: labels || [],
                team_id: teamId,
                sentAt: new Date(),
                recipients: {
                    create: recipient_ids.map((recipientId: string) => ({
                        recipient_id: recipientId,
                        recipient_type: "TO",
                    })),
                },
            },
            include: {
                recipients: true,
            },
        });

        return NextResponse.json(message);
    } catch (error) {
        console.error("Error creating message:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
