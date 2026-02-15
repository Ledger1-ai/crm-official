
import { Suspense } from "react";
import Container from "../../components/ui/Container";
import ProjectCalendarView from "@/app/(routes)/campaigns/calendar/components/ProjectCalendarView";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return redirect("/");
    }

    const user = await prismadb.users.findUnique({
        where: { id: session.user.id },
        select: { team_role: true }
    });

    return (
        <Container
            title="Calendar"
            description="Manage your tasks and schedule events."
        >
            <Suspense fallback={<div>Loading calendar...</div>}>
                <ProjectCalendarView userId={session.user.id} />
            </Suspense>
        </Container>
    );
}
