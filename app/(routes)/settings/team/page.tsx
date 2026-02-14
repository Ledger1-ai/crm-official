
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prismadb } from "@/lib/prisma";
import Container from "@/app/(routes)/components/ui/Container";
import TeamAiSettings from "./_components/TeamAiSettings";

export default async function TeamSettingsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return redirect("/sign-in");
    }

    const user = await prismadb.users.findUnique({
        where: { email: session.user.email },
        include: { assigned_team: true }
    });

    if (!user?.assigned_team) {
        return (
            <Container title="Team Settings" description="Manage your team preferences.">
                <div className="p-4">
                    <p>You are not assigned to any team.</p>
                </div>
            </Container>
        );
    }

    return (
        <Container title="Team Settings" description="Manage your team preferences.">
            <div className="space-y-8">
                <TeamAiSettings teamId={user.assigned_team.id} />
            </div>
        </Container>
    );
}
