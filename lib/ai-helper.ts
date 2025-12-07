
import { prismadb } from "./prisma";
import { createOpenAI } from "@ai-sdk/openai";
import { createAzure } from "@ai-sdk/azure";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";
import { AiProvider } from "@prisma/client";

export async function getAiClient(teamId: string) {
    // 1. Fetch Team Config
    const teamConfig = await prismadb.teamAiConfig.findUnique({
        where: { team_id: teamId },
    });

    const preferredProvider = teamConfig?.provider || "OPENAI";

    // 2. Fetch System Config for logic reuse
    const systemConfig = await prismadb.systemAiConfig.findUnique({
        where: { provider: preferredProvider }
    });

    // 3. Determine Active Model
    // Priority: Team Override -> System Default for Provider -> Any Active for Provider
    let modelRecord = null;

    if (teamConfig?.modelId) {
        modelRecord = await prismadb.aiModel.findFirst({
            where: { modelId: teamConfig.modelId, provider: preferredProvider, isActive: true }
        });
    }

    if (!modelRecord && systemConfig?.defaultModelId) {
        modelRecord = await prismadb.aiModel.findFirst({
            where: { modelId: systemConfig.defaultModelId, provider: preferredProvider, isActive: true }
        });
    }

    // Fallback to ANY active model for this provider if no default set
    if (!modelRecord) {
        modelRecord = await prismadb.aiModel.findFirst({
            where: { provider: preferredProvider, isActive: true }
        });
    }

    if (!modelRecord) {
        throw new Error("No active AI models found.");
    }

    // 4. Determine Configuration (Key, URL, Azure specifics)
    let apiKey: string | null = null;
    let baseURL: string | null = null;
    let providerConfig: any = {};

    if (teamConfig && !teamConfig.useSystemKey && teamConfig.apiKey) {
        // Use Team Key - Simple key only
        apiKey = teamConfig.apiKey;
    } else {
        // Use System Key & Configs
        apiKey = systemConfig?.apiKey || process.env[`${modelRecord.provider}_API_KEY`] || null;
        baseURL = systemConfig?.baseUrl || null;
        providerConfig = systemConfig?.configuration as any || {};
    }

    if (!apiKey) {
        if (modelRecord.provider === "OPENAI") apiKey = process.env.OPENAI_API_KEY!;
    }

    if (!apiKey && modelRecord.provider !== "GOOGLE") {
        // throw new Error(`No API Key found for provider ${modelRecord.provider}`);
    }

    // 5. Instantiate SDK
    let model;

    switch (modelRecord.provider) {
        case "OPENAI":
            const openai = createOpenAI({ apiKey: apiKey!, baseURL: baseURL || undefined });
            model = openai(modelRecord.modelId);
            break;

        case "AZURE":
            const resourceName = providerConfig.resourceName || process.env.AZURE_OPENAI_RESOURCE_NAME;
            const deploymentId = providerConfig.deploymentId || process.env.AZURE_OPENAI_DEPLOYMENT || modelRecord.modelId;

            if (!resourceName) throw new Error("Azure Resource Name missing");

            const azure = createAzure({
                apiKey: apiKey!,
                resourceName,
                baseURL: baseURL || undefined
            });

            model = azure(deploymentId);
            break;

        case "ANTHROPIC":
            const anthropic = createAnthropic({ apiKey: apiKey!, baseURL: baseURL || undefined });
            model = anthropic(modelRecord.modelId);
            break;

        case "GOOGLE":
            const google = createGoogleGenerativeAI({
                apiKey: apiKey!,
                baseURL: baseURL || undefined
            });
            model = google(modelRecord.modelId);
            break;

        case "MISTRAL":
            const mistral = createMistral({ apiKey: apiKey!, baseURL: baseURL || undefined });
            model = mistral(modelRecord.modelId);
            break;

        case "GROK":
            const grok = createOpenAI({
                apiKey: apiKey!,
                baseURL: baseURL || "https://api.x.ai/v1"
            });
            model = grok(modelRecord.modelId);
            break;

        case "DEEPSEEK":
            const deepseek = createOpenAI({
                apiKey: apiKey!,
                baseURL: baseURL || "https://api.deepseek.com"
            });
            model = deepseek(modelRecord.modelId);
            break;

        case "PERPLEXITY":
            const perplexity = createOpenAI({
                apiKey: apiKey!,
                baseURL: baseURL || "https://api.perplexity.ai"
            });
            model = perplexity(modelRecord.modelId);
            break;

        default:
            throw new Error(`Provider ${modelRecord.provider} not supported`);
    }

    return { client: model, model: model, provider: modelRecord.provider, modelId: modelRecord.modelId };
}
