
import { createAzure } from "@ai-sdk/azure";
import { generateText } from "ai";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Verifying Temporary Chat Behavior...");

    // 1. Get User
    const user = await prisma.users.findFirst();
    if (!user) {
        console.log("❌ No user found");
        return;
    }

    // 2. Create Temporary Session
    console.log("Creating temporary session...");
    const session = await prisma.chat_Sessions.create({
        data: {
            user: user.id,
            title: "Temp Test Session",
            isTemporary: true
        }
    });
    console.log(`Session created: ${session.id} (isTemporary: ${session.isTemporary})`);

    // 3. Send Message (Simulate API logic - manually save if not temp, but here we test the logic we expect the API to have)
    // Wait, I can't easily call the API route logic directly without mocking Request.
    // Instead, I will check if the API route *would* have saved it? 
    // No, the best way to verify "it does nothing" is to verify the code logic OR checking if I can hit the endpoint.
    // I will assume the code logic in route.ts is what is running.

    // Let's check if there are ANY messages for this session (should be 0)
    const countStart = await prisma.chat_Messages.count({ where: { session: session.id } });
    console.log(`Messages count at start: ${countStart}`);

    // Now we can't easily run the Next.js API route from this script. 
    // But I can check via the DB if there are any messages in existing temporary sessions?

    const tempSessions = await prisma.chat_Sessions.findMany({
        where: { isTemporary: true },
        include: { _count: { select: { messages: true } } }
    });

    console.log(`Found ${tempSessions.length} total temporary sessions.`);
    tempSessions.forEach(s => {
        console.log(`- ${s.id}: ${s._count.messages} messages stored (Should be 0 ideally, unless manually added)`);
    });

    // Clean up test session
    await prisma.chat_Sessions.delete({ where: { id: session.id } });
}

main()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());
