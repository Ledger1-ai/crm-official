"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const getUserMessages = async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];

    // Fetch user to get team context
    const user = await prismadb.users.findUnique({
        where: { id: session.user.id },
        select: { team_id: true }
    });

    const teamId = user?.team_id;

    // 1. Fetch Unread Messages
    const internalMessages = await prismadb.internalMessageRecipient.findMany({
        where: {
            recipient_id: session.user.id,
            is_read: false,
            is_deleted: false,
            is_archived: false,
        },
        include: {
            message: true
        },
        orderBy: {
            createdAt: "desc",
        },
        take: 100
    });

    // 2. Fetch New Form Submissions (Team-wide)
    let formSubmissions: any[] = [];
    if (teamId) {
        formSubmissions = await (prismadb as any).formSubmission.findMany({
            where: {
                team_id: teamId,
                status: "NEW"
            },
            include: {
                form: {
                    select: { name: true }
                }
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 100
        });
    }

    // 3. Normalize and Combine
    const notifications = [
        ...internalMessages.map(m => ({
            id: m.message.id,
            type: 'message' as const,
            createdAt: m.createdAt,
            title: m.message.subject,
            body: m.message.body_text || "No content",
            sender: {
                name: m.message.sender_name || "Unknown",
                email: m.message.sender_email,
                avatar: null as string | null
            },
            url: `/messages?id=${m.message.id}` // Assuming /messages route
        })),
        ...formSubmissions.map(f => ({
            id: f.id,
            type: 'form' as const,
            createdAt: f.createdAt,
            title: `New Submission: ${f.form.name}`,
            body: `From: ${f.extracted_email || 'Anonymous'}`,
            sender: {
                name: f.extracted_name || "Form System",
                email: f.extracted_email,
                avatar: null as string | null
            },
            url: `/messages?tab=forms&id=${f.id}` // Assuming /messages handles forms too
        }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 100);

    return notifications;
};
