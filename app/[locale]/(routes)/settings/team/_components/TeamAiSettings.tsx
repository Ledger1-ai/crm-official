
import { prismadb } from "@/lib/prisma";
import { AiProvider } from "@prisma/client";
import { TeamAiForm } from "./TeamAiForm";

interface TeamAiSettingsProps {
    teamId: string;
}

const TeamAiSettings = async ({ teamId }: TeamAiSettingsProps) => {

    const teamConfig = await prismadb.teamAiConfig.findUnique({
        where: { team_id: teamId }
    });

    // Fetch system configs to determine which providers are enabled
    const systemConfigs = await prismadb.systemAiConfig.findMany();

    // Fetch all active models to populate dropdowns
    const activeModels = await prismadb.aiModel.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
    });

    // Helper to check if provider is enabled (default to true if no config exists)
    const isProviderEnabled = (provider: AiProvider) => {
        const config = systemConfigs.find(c => c.provider === provider);
        return config ? config.isActive : true;
    };

    const enabledProviders = Object.values(AiProvider).filter(isProviderEnabled);

    return (
        <TeamAiForm
            teamId={teamId}
            initialConfig={teamConfig}
            activeModels={activeModels}
            enabledProviders={enabledProviders}
        />
    );
};

export default TeamAiSettings;
