
import { prismadb } from "../lib/prisma";
import { getAiSdkModel } from "../lib/openai";
import { generateText } from "ai";

async function main() {
    console.log("Testing AI Connection...");

    // 1. Get a user
    const user = await prismadb.users.findFirst();
    if (!user) {
        console.error("No user found in DB");
        return;
    }
    console.log(`Using user: ${user.email} (${user.id})`);

    // 2. Get Model
    const model = await getAiSdkModel(user.id);
    if (!model) {
        console.error("No model returned by getAiSdkModel");
        return;
    }
    console.log("Model initialized:", model.modelId);

    // 3. Test Generation
    try {
        console.log("Sending prompt 'Hello, are you working?'...");
        const { text } = await generateText({
            model,
            prompt: "Hello, are you working?",
        });

        console.log("Response from AI:");
        console.log(text);
    } catch (error) {
        console.error("Error generating text:", error);
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prismadb.$disconnect());
