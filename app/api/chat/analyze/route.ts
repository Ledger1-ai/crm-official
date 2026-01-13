import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadbChat } from "@/lib/prisma-chat";
import { getAiSdkModel } from "@/lib/openai";
import { generateObject } from "ai";
import { z } from "zod";

const db: any = prismadbChat;

// Define the schema for the analysis result
const AnalysisSchema = z.object({
    score: z.number().min(0).max(100).describe("A score between 0 and 100 representing the quality of the lead or interaction success."),
    sentiment: z.enum(["positive", "neutral", "negative"]).describe("The overall sentiment of the user in the conversation."),
    topics: z.array(z.string()).describe("List of key topics discussed."),
    reasoning: z.string().describe("Brief explanation of why this score was assigned."),
});

export async function POST(req: Request) {
    const auth = await getServerSession(authOptions);
    if (!auth) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { sessionId } = await req.json();

        if (!sessionId) {
            return new NextResponse("Session ID is required", { status: 400 });
        }

        // Fetch chat history
        // We need to fetch messages from the DB
        const messages = await db.chat_Messages.findMany({
            where: { session: sessionId },
            orderBy: { createdAt: "asc" },
            select: { role: true, content: true }
        });

        if (!messages || messages.length === 0) {
            return NextResponse.json({
                score: 0,
                sentiment: "neutral",
                topics: [],
                reasoning: "No messages to analyze."
            });
        }

        // Format messages for the prompt
        // We'll summarize the conversation for the "Regress-LM" simulation
        const model = await getAiSdkModel(auth.user.id);
        if (!model) {
            return new NextResponse("AI Model configuration missing", { status: 500 });
        }

        const systemPrompt = `You are an expert CRM analyst. Your job is to analyze the following conversation and output a 'Lead Score' and sentiment analysis.
    
    The 'Lead Score' (0-100) should reflect:
    - User engagement and intent
    - Clarity of requirements
    - Likelihood of conversion or successful support resolution
    
    Be strict but fair. High scores (80+) should be reserved for high-value interactions.`;

        const formattedMessages = messages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join("\n---\n");
        const prompt = `Analyze this conversation:\n\n${formattedMessages}`;

        const { object } = await generateObject({
            model,
            schema: AnalysisSchema,
            prompt: prompt,
            system: systemPrompt,
        });

        return NextResponse.json(object);

    } catch (error) {
        console.error("[CHAT_ANALYZE_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
