import OpenAI, { AzureOpenAI } from "openai";
import { prismadb } from "./prisma";

// Azure/OpenAI helper returns a configured OpenAI client.
// Prefers Azure OpenAI when required env vars are present, otherwise falls back to direct OpenAI API key.
export async function openAiHelper(userId: string) {
  // Prefer Azure OpenAI if all required settings are present
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
  const azureApiVersion = process.env.AZURE_OPENAI_API_VERSION;
  const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;

  if (azureEndpoint && azureApiKey && azureApiVersion && azureDeployment) {
    // Use AzureOpenAI client when Azure configuration is present
    const openai = new AzureOpenAI({
      apiKey: azureApiKey,
      endpoint: azureEndpoint,
      apiVersion: azureApiVersion,
    });

    return openai;
  }

  // Fallback: direct OpenAI API using key from DB or environment
  const openAiKey = await prismadb.systemServices.findFirst({
    where: {
      name: "openAiKey",
    },
  });

  const userOpenAiKey = await prismadb.openAi_keys.findFirst({
    where: {
      user: userId,
    },
  });

  let apiKey =
    openAiKey?.serviceKey ||
    userOpenAiKey?.api_key ||
    process.env.OPENAI_API_KEY ||
    process.env.OPEN_AI_API_KEY;

  if (!apiKey) {
    console.log("No API key found in the environment");
    return null;
  }

  // Direct OpenAI client (non-Azure)
  const openai = new OpenAI({
    apiKey,
  });

  return openai;
}
