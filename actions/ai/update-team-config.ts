
"use server";

import { prismadb } from "@/lib/prisma";
import { AiProvider } from "@prisma/client";
import { revalidatePath } from "next/cache";

export const updateTeamAiConfig = async (formData: FormData) => {
    const teamId = formData.get("teamId") as string;
    const provider = formData.get("provider") as AiProvider;
    const modelId = formData.get("modelId") as string;
    const useSystemKey = formData.get("useSystemKey") === "system";
    const apiKey = formData.get("apiKey") as string;

    // If modelId is empty or "default", set to null to use provider default
    const finalModelId = (modelId === "default" || modelId === "") ? null : modelId;

    await prismadb.teamAiConfig.upsert({
        where: { team_id: teamId },
        create: {
            team_id: teamId,
            provider: provider,
            modelId: finalModelId,
            useSystemKey: useSystemKey,
            apiKey: useSystemKey ? null : apiKey
        },
        update: {
            provider: provider,
            modelId: finalModelId,
            useSystemKey: useSystemKey,
            apiKey: useSystemKey ? null : apiKey
        }
    });

    revalidatePath(`/settings/team/${teamId}`);
    revalidatePath(`/settings/team`);
    revalidatePath(`/admin`); // Also revalidate admin dashboard since it's embedded there now
};
