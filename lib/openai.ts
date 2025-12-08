
import { createAzure } from "@ai-sdk/azure";
import { openai, createOpenAI } from "@ai-sdk/openai";
import { prismadb } from "@/lib/prisma";

export function isReasoningModel(modelId: string | undefined | null): boolean {
    if (!modelId) return false;
    return modelId.toLowerCase().includes("o1") || modelId.toLowerCase().includes("gpt-5");
}

export async function getAiSdkModel(userId: string | "system") {
    const DEBUG_PREFIX = "[getAiSdkModel]";
    // Helper to get system config
    const getSystemConfig = async () => {
        try {
            // Find the active system config, or just the first one
            // Ideally we'd filter by isActive: true, but following existing pattern
            const sysConfig = await prismadb.systemAiConfig.findFirst({
                where: { isActive: true }
            });
            return sysConfig;
        } catch (error) {
            console.warn("Failed to fetch system config", error);
            return null;
        }
    };

    const systemConfig = await getSystemConfig();
    const systemModelId = systemConfig?.defaultModelId || process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o";    

    // Helper to get Azure provider
    const getAzureModel = (modelId: string, apiKey?: string, config?: any) => {
        let key = apiKey || process.env.AZURE_OPENAI_API_KEY;
        let url = process.env.AZURE_OPENAI_ENDPOINT; // Default to env var

        // If we have config from DB (UnifiedAiCard format), construct URL
        if (config?.resourceName) {
            // Construct: https://{resourceName}.openai.azure.com/openai/deployments/{deploymentId}
            // Note: The AI SDK might expect just the base resource URL or full endpoint.
            // createAzure({ baseURL }) usually expects the resource URL (e.g. https://my-resource.openai.azure.com/openai/deployments/my-deployment)
            // OR just the generic base https://my-resource.openai.azure.com if we pass deployment via model('deployment-name')

            // However, typical Azure AI SDK usage:
            // const azure = createAzure({ resourceName: '...', apiKey: '...' })
            // BUT the SDK wrapper we are using (vercel ai sdk) uses baseURL + apiKey usually.

            // Let's try to construct the resource URL if not provided.
            // "https://RESOURCE.openai.azure.com"
            // The SDK handles appending /openai/deployments/... if we give it the resource base.

            // Wait, createAzure from @ai-sdk/azure supports 'resourceName' directly!
            // Let's fallback to that if simpler.

            // Parsing the config:
            const resourceName = config.resourceName;

            // If we have resourceName, we can pass it directly to createAzure.
            if (resourceName && key) {
                const azure = createAzure({
                    resourceName: resourceName,
                    apiKey: key,
                });
                // When using resourceName, the model ID passed to azure(...) should be the deployment name.
                // config.deploymentId might be the model ID we want to use?
                // Or 'modelId' passed in is the deployment name?
                // Usually in this app, modelId seems to be the deployment name for Azure.
                return azure(modelId || config.deploymentId);
            }
        }

        // Fallback to URL based
        if (key && url) {
            const azure = createAzure({
                apiKey: key,
                baseURL: url,
            });
            return azure(modelId);
        }
        return null;
    };

    // Helper to get OpenAI provider
    const getOpenAIModel = (modelId: string, apiKey?: string) => {
        // Force standard OpenAI URL to prevent accidental Azure fallback via env vars
        const customOpenai = createOpenAI({
            apiKey: apiKey || process.env.OPENAI_API_KEY,
            baseURL: "https://api.openai.com/v1"
        });
        return customOpenai(modelId);
    };


    // If system request, return system model based on provider
    if (userId === "system") {
        if (systemConfig?.provider === "AZURE") {
            const az = getAzureModel(
                systemModelId,
                systemConfig.apiKey,
                systemConfig.configuration
            );
            if (az) {
                console.debug(`${DEBUG_PREFIX} Selected modelId="${systemModelId}" | Source: SystemConfig (AZURE) | userId=system`);
                return az;
            }
        }

        // Legacy fallback
        if (!systemConfig && process.env.AZURE_OPENAI_API_KEY) {
            console.debug(`${DEBUG_PREFIX} Selected modelId="${systemModelId}" | Source: EnvVars (AZURE legacy fallback) | userId=system`);
            return getAzureModel(systemModelId)!;
        }

        console.debug(`${DEBUG_PREFIX} Selected modelId="${systemModelId}" | Source: SystemConfig/OpenAI (fallback) | userId=system`);
        return getOpenAIModel(systemModelId, systemConfig?.apiKey);
    }

    // 2. Get user's team
    const user = await prismadb.users.findUnique({
        where: { id: userId },
        select: { team_id: true }
    });

    if (!user?.team_id) {
        // Fallback to system logic
        if (systemConfig?.provider === "AZURE") {
            const az = getAzureModel(systemModelId, systemConfig.apiKey, systemConfig.configuration);
            if (az) {
                console.debug(`${DEBUG_PREFIX} Selected modelId="${systemModelId}" | Source: SystemConfig (AZURE, no team) | userId=${userId}`);
                return az;
            }
        }
        if (!systemConfig && process.env.AZURE_OPENAI_API_KEY) {
            console.debug(`${DEBUG_PREFIX} Selected modelId="${systemModelId}" | Source: EnvVars (AZURE legacy, no team) | userId=${userId}`);
            return getAzureModel(systemModelId)!;
        }
        console.debug(`${DEBUG_PREFIX} Selected modelId="${systemModelId}" | Source: SystemConfig/OpenAI (no team) | userId=${userId}`);
        return getOpenAIModel(systemModelId, systemConfig?.apiKey);
    }

    // 3. Get team's AI config
    const teamConfig = await prismadb.teamAiConfig.findUnique({
        where: { team_id: user.team_id },
    });

    // 4. Determine which provider/model to use
    if (teamConfig) {
        // Use team model if specified, otherwise system default
        const modelId = teamConfig.modelId || systemModelId;

        if (teamConfig.provider === "AZURE") {
            if (teamConfig.useSystemKey) {
                if (systemConfig?.provider === "AZURE") {
                    const az = getAzureModel(modelId, systemConfig.apiKey, systemConfig.configuration);
                    if (az) {
                        console.debug(`${DEBUG_PREFIX} Selected modelId="${modelId}" | Source: TeamConfig (AZURE, useSystemKey) | userId=${userId} | teamId=${user.team_id}`);
                        return az;
                    }
                }
                if (process.env.AZURE_OPENAI_API_KEY) {
                    console.debug(`${DEBUG_PREFIX} Selected modelId="${modelId}" | Source: TeamConfig (AZURE envVars, useSystemKey) | userId=${userId} | teamId=${user.team_id}`);
                    return getAzureModel(modelId)!;
                }
            } else {
                // Custom Team Azure? Not fully supported in UI yet (only apiKey in schema), 
                // assumng env vars or partial support via apiKey
                console.debug(`${DEBUG_PREFIX} TeamConfig AZURE without useSystemKey - not fully supported | userId=${userId} | teamId=${user.team_id}`);
            }
        }

        // STANDARD OPENAI / DEFAULT
        if (teamConfig.provider === "OPENAI" || teamConfig.provider === undefined) {
            if (teamConfig.apiKey && !teamConfig.useSystemKey) {
                console.debug(`${DEBUG_PREFIX} Selected modelId="${modelId}" | Source: TeamConfig (OPENAI, custom apiKey) | userId=${userId} | teamId=${user.team_id}`);
                return getOpenAIModel(modelId, teamConfig.apiKey);
            }
            console.debug(`${DEBUG_PREFIX} Selected modelId="${modelId}" | Source: TeamConfig (OPENAI, systemKey) | userId=${userId} | teamId=${user.team_id}`);
            return getOpenAIModel(modelId, systemConfig?.apiKey);
        }
    }

    // FALLBACK
    if (systemConfig?.provider === "AZURE") {
        const az = getAzureModel(systemModelId, systemConfig.apiKey, systemConfig.configuration);
        if (az) {
            console.debug(`${DEBUG_PREFIX} Selected modelId="${systemModelId}" | Source: Fallback SystemConfig (AZURE) | userId=${userId}`);
            return az;
        }
    }

    if (!systemConfig && process.env.AZURE_OPENAI_API_KEY) {
        console.debug(`${DEBUG_PREFIX} Selected modelId="${systemModelId}" | Source: Fallback EnvVars (AZURE legacy) | userId=${userId}`);
        return getAzureModel(systemModelId)!;
    }

    console.debug(`${DEBUG_PREFIX} Selected modelId="${systemModelId}" | Source: Fallback OpenAI (final) | userId=${userId}`);
    return getOpenAIModel(systemModelId, systemConfig?.apiKey);
}
