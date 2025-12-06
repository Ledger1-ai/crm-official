import { NextResponse } from 'next/server';
import { prismadb } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, subject, message, source } = body;

        if (!name || !email || !message) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // @ts-ignore
        const ticket = await prismadb.supportTicket.create({
            data: {
                name,
                email,
                subject: subject || "No Subject",
                message,
                source: source || "UNKNOWN",
                status: "NEW"
            }
        });

        // Log system activity (optional, but good for tracking)
        // Ignoring to keep it simple or maybe logging as system?
        // Let's just return success.

        return NextResponse.json(ticket);
    } catch (error) {
        console.error("[SUPPORT_CREATE_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
