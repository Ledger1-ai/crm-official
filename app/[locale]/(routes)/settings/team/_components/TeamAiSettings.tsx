
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

    // Fetch all active models to populate dropdowns
    const activeModels = await prismadb.aiModel.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
    });

    return (
        <TeamAiForm
            teamId={teamId}
            initialConfig={teamConfig}
            activeModels={activeModels}
        />
    );
};

export default TeamAiSettings;
