import { prismadb } from "@/lib/prisma";
import { AiProvider } from "@prisma/client";
import { TeamAiFormCompact } from "./TeamAiFormCompact";

interface TeamAiSettingsCompactProps {
    teamId: string;
}

const TeamAiSettingsCompact = async ({ teamId }: TeamAiSettingsCompactProps) => {

    const teamConfig = await prismadb.teamAiConfig.findUnique({
        where: { team_id: teamId }
    });

    const systemConfigs = await prismadb.systemAiConfig.findMany();

    const activeModels = await prismadb.aiModel.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
    });

    const isProviderEnabled = (provider: AiProvider) => {
        const config = systemConfigs.find(c => c.provider === provider);
        return config ? config.isActive : true;
    };

    const enabledProviders = Object.values(AiProvider).filter(isProviderEnabled);

    const providersWithSystemKey = systemConfigs
        .filter(c => c.apiKey && c.apiKey.trim().length > 0)
        .map(c => c.provider);

    return (
        <TeamAiFormCompact
            teamId={teamId}
            initialConfig={teamConfig}
            activeModels={activeModels}
            enabledProviders={enabledProviders}
            providersWithSystemKey={providersWithSystemKey}
        />
    );
};

export default TeamAiSettingsCompact;
