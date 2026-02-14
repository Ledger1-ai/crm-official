import React, { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Container from "../components/ui/Container";
import SuspenseLoading from "@/components/loadings/suspense";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDictionary } from "@/dictionaries";
import { prismadb } from "@/lib/prisma";
import { InternalMessagesComponent } from "./components/InternalMessagesComponent";

const MessagesRoute = async () => {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/");
    }

    const lang = session.user.userLanguage;
    const dict = await getDictionary(lang as "en" | "cz" | "de");
    const teamId = (session.user as any).team_id;
    const teamRole = (session.user as any).team_role;

    // PLATFORM_ADMIN has god mode - fetch ALL team members across teams
    const isPlatformAdmin = teamRole === "PLATFORM_ADMIN";

    // Fetch team members (god mode for PLATFORM_ADMIN)
    const teamMembers = await prismadb.users.findMany({
        where: isPlatformAdmin ? {} : { team_id: teamId || undefined },
        select: {
            id: true,
            name: true,
            email: true,
            team_id: true,
            assigned_team: {
                select: { name: true }
            }
        },
        take: isPlatformAdmin ? 500 : 100, // Limit for performance
    });

    // Fetch messages from InternalMessage table
    let messages: any[] = [];
    try {
        const rawMessages = await prismadb.internalMessage.findMany({
            where: {
                team_id: teamId,
                OR: [
                    { sender_id: session.user.id },
                    { recipients: { some: { recipient_id: session.user.id } } },
                ],
            },
            include: {
                recipients: true,
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        });

        messages = rawMessages.map((m) => {
            let toUserId = "";
            // Determine primary "to_user" for UI display
            if (m.sender_id === session.user.id) {
                toUserId = m.recipients[0]?.recipient_id || "";
            } else {
                toUserId = session.user.id;
            }

            const myRecipient = m.recipients.find((r) => r.recipient_id === session.user.id);

            const fromUser = teamMembers.find(u => u.id === m.sender_id) || { id: m.sender_id, name: m.sender_name, email: m.sender_email };
            const toUser = teamMembers.find(u => u.id === toUserId) || { id: toUserId, name: "Unknown", email: "" };

            return {
                id: m.id,
                subject: m.subject,
                body: m.body_text || m.body_html || "",
                createdAt: m.createdAt,
                is_read: myRecipient?.is_read || false,
                is_important: m.priority === "URGENT" || m.priority === "HIGH",
                labels: m.labels,
                from_user_id: m.sender_id,
                to_user_id: toUserId,
                from_user: fromUser,
                to_user: toUser,
                recipients: m.recipients,
                status: m.status
            };
        });
    } catch (e) {
        console.error("Failed to fetch messages", e);
        messages = [];
    }

    // Fetch form submissions (visible based on form visibility)
    let formSubmissions: any[] = [];
    try {
        formSubmissions = await (prismadb as any).formSubmission?.findMany?.({
            where: {
                team_id: teamId,
                form: {
                    OR: [
                        { visibility: "PUBLIC" },
                        { visibility: "PRIVATE", created_by: session.user.id },
                    ],
                },
            },
            include: {
                form: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        project_id: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        }) || [];
    } catch (e) {
        // Model might not exist yet, return empty
        formSubmissions = [];
    }

    const layout = (await cookies()).get("react-resizable-panels:layout");
    const collapsed = (await cookies()).get("react-resizable-panels:collapsed");

    const defaultLayout = layout ? JSON.parse(layout.value) : undefined;
    const defaultCollapsed = collapsed ? JSON.parse(collapsed.value) : undefined;

    return (
        <Container
            title="Messages"
            description="Internal team messaging. Send and receive messages from your team members."
        >
            <Suspense fallback={<SuspenseLoading />}>
                <InternalMessagesComponent
                    messages={messages}
                    teamMembers={teamMembers}
                    formSubmissions={formSubmissions}
                    currentUserId={session.user.id}
                    currentUserName={session.user.name || session.user.email || "You"}
                    currentUserEmail={session.user.email || ""}
                    defaultLayout={defaultLayout}
                    defaultCollapsed={defaultCollapsed}
                />
            </Suspense>
        </Container>
    );
};

export default MessagesRoute;
