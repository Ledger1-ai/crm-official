import React, { Suspense } from "react";
import Container from "../../components/ui/Container";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SuspenseLoading from "@/components/loadings/suspense";
import ProjectCalendarView from "./components/ProjectCalendarView";

export const maxDuration = 300;

const CalendarPage = async () => {
    const session = await getServerSession(authOptions);

    if (!session) return redirect("/sign-in");

    return (
        <Container
            title="Calendar"
            description="Visual calendar view of task deadlines"
        >
            <Suspense fallback={<SuspenseLoading />}>
                <ProjectCalendarView userId={session.user.id!} />
            </Suspense>
        </Container>
    );
};

export default CalendarPage;
