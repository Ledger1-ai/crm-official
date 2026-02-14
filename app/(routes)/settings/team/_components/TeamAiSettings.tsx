
import { prismadb } from "@/lib/prisma";
import { AiProvider } from "@prisma/client";
import { AiConfigManager } from "@/components/ai/AiConfigManager";

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

    // Helper to check if provider has system key configured
    // Note: We check if apiKey is present AND not empty string.
    const providersWithSystemKey = systemConfigs
        .filter(c => c.apiKey && c.apiKey.trim().length > 0)
        .map(c => c.provider);

    return (
        <AiConfigManager
            teamId={teamId}
            currentConfig={teamConfig}
            models={activeModels}
            providersWithSystemKey={providersWithSystemKey}
        />
    );
};

export default TeamAiSettings;
