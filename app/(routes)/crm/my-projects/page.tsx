import React, { Suspense } from "react";
import Container from "../../components/ui/Container";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

import SuspenseLoading from "@/components/loadings/suspense";
import MyProjectsView from "./_components/MyProjectsView";

export const maxDuration = 300;

const MyProjectsPage = async () => {
    const session = await getServerSession(authOptions);

    if (!session) return redirect("/sign-in");

    return (
        <Container
            title="My Projects"
            description={"Projects and lead pools assigned to you"}
        >
            <Suspense fallback={<SuspenseLoading />}>
                <MyProjectsView userId={session.user.id} />
            </Suspense>
        </Container>
    );
};

export default MyProjectsPage;
