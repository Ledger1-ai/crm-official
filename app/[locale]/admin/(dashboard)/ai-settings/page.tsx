import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import Container from "@/app/[locale]/(routes)/components/ui/Container";
import AiSettingsView from "./_components/AiSettingsView";

export default async function AdminAiSettingsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
        redirect("/");
    }

    // Get current user's team
    const user = await prismadb.users.findUnique({
        where: { email: session.user.email || "" },
        include: { assigned_team: true },
    });

    const teamId = user?.assigned_team?.id;

    if (!teamId) {
        return (
            <Container
                title="AI Settings"
                description="No team found for your account"
            >
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                    Please contact support to be assigned to a team.
                </div>
            </Container>
        );
    }

    // Fetch AI data in parallel
    const [teamConfig, systemConfigs, activeModels] = await Promise.all([
        prismadb.teamAiConfig.findUnique({
            where: { team_id: teamId },
        }),
        prismadb.systemAiConfig.findMany(),
        prismadb.aiModel.findMany({
            where: { isActive: true },
            orderBy: [{ provider: "asc" }, { name: "asc" }],
        }),
    ]);

    // Determine which providers have system keys configured
    const providersWithSystemKey = systemConfigs
        .filter((c) => c.apiKey && c.apiKey.trim().length > 0)
        .map((c) => c.provider);

    // Filter to only show models from enabled providers
    const enabledProviders = systemConfigs
        .filter((c) => c.isActive)
        .map((c) => c.provider);

    const availableModels = activeModels.filter((m) =>
        enabledProviders.includes(m.provider)
    );

    return (
        <Container
            title="AI Settings"
            description="Configure your team's AI model preferences and API keys"
        >
            <AiSettingsView
                teamId={teamId}
                currentConfig={teamConfig}
                models={availableModels}
                providersWithSystemKey={providersWithSystemKey}
            />
        </Container>
    );
}
