
import { createAzure } from "@ai-sdk/azure";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Verifying AI Connection...");

    // 1. Check Env Vars
    const azureKey = process.env.AZURE_OPENAI_API_KEY;
    const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;
    const openAiKey = process.env.OPENAI_API_KEY;

    console.log("Environment:");
    console.log(`- Azure Key: ${azureKey ? "✅ Present" : "❌ Missing"}`);
    console.log(`- Azure Endpoint: ${azureEndpoint ? "✅ Present" : "❌ Missing"}`);
    console.log(`- Azure Deployment: ${azureDeployment ? "✅ Present" : "❌ Missing"}`);
    console.log(`- OpenAI Key: ${openAiKey ? "✅ Present" : "❌ Missing"}`);

    let model;

    // 2. Select Model (Simulate logic from lib/openai.ts simplified)
    if (azureKey && azureEndpoint && azureDeployment) {
        console.log("👉 Using Azure OpenAI Provider");
        console.log(`Endpoint provided: ${azureEndpoint}`);
        console.log(`Deployment provided: ${azureDeployment}`);

        // Try 1: Use as is
        console.log("--- Attempt 1: Default ---");
        try {
            const azure = createAzure({
                apiKey: azureKey,
                baseURL: azureEndpoint,
            });
            const model = azure(azureDeployment);
            const { text } = await generateText({
                model,
                prompt: "Reflect: Connection 1 Working",
            });
            console.log("✅ Attempt 1 Success:", text);
            return;
        } catch (e: any) {
            console.log("❌ Attempt 1 Failed:", e.message);
        }

        // Try 2: Strip path (if user pasted full deployment URL)
        console.log("--- Attempt 2: Stripped Base URL ---");
        try {
            const urlObj = new URL(azureEndpoint);
            const baseUrl = `${urlObj.protocol}//${urlObj.host}`; // Just https://foo.com
            console.log(`Trying Base URL: ${baseUrl}`);

            const azure = createAzure({
                apiKey: azureKey,
                baseURL: baseUrl,
            });
            const model = azure(azureDeployment);
            const { text } = await generateText({
                model,
                prompt: "Reflect: Connection 2 Working",
            });
            console.log("✅ Attempt 2 Success:", text);
            return;
        } catch (e: any) {
            console.log("❌ Attempt 2 Failed:", e.message);
        }

        return; // Stop here if failed
    } else if (openAiKey) {
        console.log("👉 Using Standard OpenAI Provider");
        const openai = createOpenAI({
            apiKey: openAiKey,
        });
        model = openai("gpt-4o");
    } else {
        console.error("❌ No valid keys found to initialize model.");
        return;
    }

    // 3. Test Generation
    try {
        console.log("💬 Sending test prompt...");
        const { text } = await generateText({
            model,
            prompt: "Reply with 'Connection Successful!' if you can read this.",
        });

        console.log("🤖 AI Response:");
        console.log(text);

        if (text.toLowerCase().includes("connection successful")) {
            console.log("✅ VERIFICATION PASSED");
        } else {
            console.log("⚠️ Received response, but unexpected content.");
        }

    } catch (error) {
        console.error("❌ Generation Failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
