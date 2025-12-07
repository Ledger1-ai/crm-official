
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Container from "@/app/[locale]/(routes)/components/ui/Container";
import TeamAiSettings from "@/app/[locale]/(routes)/settings/team/_components/TeamAiSettings";
import { redirect } from "next/navigation";

export default async function AdminTeamAiPage() {
    const session = await getServerSession(authOptions);

    if (!session) redirect("/sign-in");

    return (
        <Container
            title="Team AI Settings"
            description="Manage your Team's AI preferences. You can use the System Keys (default) or bring your own API keys."
        >
            <div className="max-w-4xl space-y-8">
                <TeamAiSettings />
            </div>
        </Container>
    );
}
