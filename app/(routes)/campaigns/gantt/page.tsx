import React, { Suspense } from "react";
import Container from "../../components/ui/Container";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SuspenseLoading from "@/components/loadings/suspense";
import GlobalGanttView from "./components/GlobalGanttView";

export const maxDuration = 300;

const GanttPage = async () => {
    const session = await getServerSession(authOptions);

    if (!session) return redirect("/sign-in");

    return (
        <Container
            title="Gantt View"
            description="Timeline view of all campaigns and tasks"
        >
            <Suspense fallback={<SuspenseLoading />}>
                <GlobalGanttView userId={session.user.id!} />
            </Suspense>
        </Container>
    );
};

export default GanttPage;
