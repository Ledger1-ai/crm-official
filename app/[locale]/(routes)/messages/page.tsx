import React, { Suspense } from "react";
import { cookies } from "next/headers";
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
        return {
            redirect: {
                destination: "/",
                permanent: false,
            },
        };
    }

    const lang = session.user.userLanguage;
    const dict = await getDictionary(lang as "en" | "cz" | "de");
    const teamId = (session.user as any).team_id;

    // Fetch team members
    const teamMembers = teamId ? await prismadb.users.findMany({
        where: {
            team_id: teamId,
        },
        select: {
            id: true,
            name: true,
            email: true,
        },
    }) : [];

    // Fetch messages from TeamMessage table
    let messages: any[] = [];
    try {
        // Check if TeamMessage model exists and fetch
        messages = await (prismadb as any).teamMessage?.findMany?.({
            where: {
                team_id: teamId,
                OR: [
                    { to_user_id: session.user.id },
                    { from_user_id: session.user.id },
                ],
            },
            include: {
                from_user: {
                    select: { id: true, name: true, email: true },
                },
                to_user: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        }) || [];
    } catch (e) {
        // Model might not exist yet, return empty
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
