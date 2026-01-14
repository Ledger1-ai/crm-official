import { createAzure } from "@ai-sdk/azure";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createMistral } from "@ai-sdk/mistral";
import { prismadb } from "@/lib/prisma";
import { AiProvider } from "@prisma/client";

export function isReasoningModel(modelId: string | undefined | null): boolean {
    if (!modelId) return false;
    return modelId.toLowerCase().includes("o1") ||
        modelId.toLowerCase().includes("gpt-5") ||
        modelId.toLowerCase().includes("deepseek-reasoner");
}

export async function getAiSdkModel(userId: string | "system") {
    const DEBUG_PREFIX = "[getAiSdkModel]";

    // --- Provider Factory Helper ---
    const createProviderModel = (provider: AiProvider, modelId: string, apiKey?: string) => {
        switch (provider) {
            case "OPENAI": {
                const openai = createOpenAI({
                    apiKey: apiKey || process.env.OPENAI_API_KEY,
                });
                return openai(modelId);
            }
            case "AZURE": {
                // Azure typically requires resource name + deployment (modelId here)
                // Fallback to env vars if no specific key provided
                const azure = createAzure({
                    apiKey: apiKey || process.env.AZURE_OPENAI_API_KEY,
                    resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME, // Assuming env usage for base
                });
                return azure(modelId);
            }
            case "GOOGLE": {
                const google = createGoogleGenerativeAI({
                    apiKey: apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
                });
                return google(modelId);
            }
            case "ANTHROPIC": {
                const anthropic = createAnthropic({
                    apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
                });
                return anthropic(modelId);
            }
            case "GROK": {
                // xAI (Grok) uses an OpenAI-compatible API
                const grok = createOpenAI({
                    name: 'grok',
                    baseURL: 'https://api.x.ai/v1',
                    apiKey: apiKey || process.env.XAI_API_KEY,
                });
                return grok(modelId);
            }
            case "DEEPSEEK": {
                // DeepSeek uses an OpenAI-compatible API
                const deepseek = createOpenAI({
                    name: 'deepseek',
                    baseURL: 'https://api.deepseek.com',
                    apiKey: apiKey || process.env.DEEPSEEK_API_KEY,
                });
                return deepseek(modelId);
            }
            case "MISTRAL": {
                const mistral = createMistral({
                    apiKey: apiKey || process.env.MISTRAL_API_KEY,
                });
                return mistral(modelId);
            }
            default:
                console.warn(`${DEBUG_PREFIX} Unknown provider ${provider}, falling back to OpenAI`);
                const fallback = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
                return fallback(modelId);
        }
    };

    // 1. Get System Config (Default Fallback)
    const getSystemConfig = async () => {
        try {
            return await prismadb.systemAiConfig.findFirst({ where: { isActive: true } });
        } catch (error) {
            console.warn("Failed to fetch system config", error);
            return null;
        }
    };
    const systemConfig = await getSystemConfig();
    const systemModelId = systemConfig?.defaultModelId || "gpt-5";
    const systemProvider = systemConfig?.provider || "OPENAI";

    // 2. Resolve User's Team Config
    let teamConfig = null;
    if (userId !== "system") {
        const user = await prismadb.users.findUnique({
            where: { id: userId },
            select: { team_id: true }
        });
        if (user?.team_id) {
            teamConfig = await prismadb.teamAiConfig.findUnique({
                where: { team_id: user.team_id },
            });
        }
    }

    // 3. Determine Final Config
    let finalProvider = systemProvider;
    let finalModelId = systemModelId;
    let finalApiKey: string | undefined = systemConfig?.apiKey ?? undefined;

    if (teamConfig) {
        // Override with team pref if set
        finalProvider = teamConfig.provider;
        finalModelId = teamConfig.modelId || systemModelId;

        // Key Logic: 
        // If useSystemKey is TRUE -> Ensure we use the system key for the TEAM'S chosen provider if available.
        // If useSystemKey is FALSE -> Use the team's apiKey.

        if (teamConfig.useSystemKey) {
            // Find system config for the TEAM'S provider? 
            // Currently schema structure: SystemAiConfig is per provider (unique).
            // We fetched `findFirst({ isActive: true })` above which is just ONE default system config.
            // We should fetch the system key specifically for the requested provider.

            if (finalProvider !== systemProvider) {
                const specificSystemConfig = await prismadb.systemAiConfig.findUnique({
                    where: { provider: finalProvider }
                });
                if (specificSystemConfig?.apiKey) {
                    finalApiKey = specificSystemConfig.apiKey;
                } else {
                    // No system key for this provider? Fallback to env vars handled inside createProviderModel
                    finalApiKey = undefined;
                }
            }
        } else {
            // Use custom team key
            if (teamConfig.apiKey) {
                finalApiKey = teamConfig.apiKey;
            }
        }
    }

    console.debug(`${DEBUG_PREFIX} Selected: Provider=${finalProvider} | Model=${finalModelId} | User=${userId}`);
    return createProviderModel(finalProvider, finalModelId, finalApiKey);
}
