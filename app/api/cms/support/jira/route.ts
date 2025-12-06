import { NextResponse } from 'next/server';
import { prismadb } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { ticketId } = body;

        if (!ticketId) {
            return new NextResponse("Missing Ticket ID", { status: 400 });
        }

        // Simulate Jira API Call
        const jiraId = `SUP-${Math.floor(1000 + Math.random() * 9000)}`;

        // @ts-ignore
        const updatedTicket = await prismadb.supportTicket.update({
            where: {
                id: ticketId
            },
            data: {
                status: "JIRA_CREATED",
                jiraTicketId: jiraId
            }
        });

        // Log Activity
        await prismadb.systemActivity.create({
            data: {
                userId: session.user.id,
                action: "PUSHED TO JIRA",
                resource: `Ticket #${jiraId}`,
                details: `Pushed support ticket from ${updatedTicket.email} to Jira.`
            }
        });

        return NextResponse.json({ success: true, jiraId });
    } catch (error) {
        console.error("[JIRA_PUSH_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
