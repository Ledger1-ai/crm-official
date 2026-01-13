
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Checking for AI Keys...");

    // Check System Services
    const systemKey = await prisma.systemServices.findFirst({
        where: {
            name: "openAiKey",
        },
    });

    if (systemKey) {
        console.log("✅ Found System OpenAI Key in systemServices");
        // console.log("Key value starts with:", systemKey.value?.substring(0, 8) + "...");
    } else {
        console.log("❌ No System OpenAI Key found in systemServices");
    }

    // Check User Keys (sample)
    const userKeysCount = await prisma.openAi_keys.count();
    console.log(`ℹ️ Found ${userKeysCount} user-specific OpenAI keys`);

    // Check Environment Variables
    console.log("Checking Environment Variables...");
    const envKeys = [
        "AZURE_OPENAI_ENDPOINT",
        "AZURE_OPENAI_API_KEY",
        "AZURE_OPENAI_API_VERSION",
        "AZURE_OPENAI_DEPLOYMENT",
        "OPENAI_API_KEY",
        "OPEN_AI_API_KEY"
    ];

    envKeys.forEach(key => {
        if (process.env[key]) {
            console.log(`✅ ${key} is set`);
        } else {
            console.log(`❌ ${key} is NOT set`);
        }
    });

}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
