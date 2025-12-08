\import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadbChat } from "@/lib/prisma-chat";
const db: any = prismadbChat;
import { getAiSdkModel, isReasoningModel } from "@/lib/openai";
import { streamText } from "ai";

// Helper to extract content from either UIMessage (parts array) or ModelMessage (content string) format
function extractMessageContent(message: any): string {
    // If content is already a string, use it
    if (typeof message.content === 'string') {
        return message.content;
    }
    // AI SDK 5.x UIMessage format: extract text from parts array
    if (Array.isArray(message.parts)) {
        return message.parts.map((part: any) => {
            if (typeof part === 'string') return part;
            if (part.type === 'text' && typeof part.text === 'string') return part.text;
            if (typeof part.content === 'string') return part.content;
            return '';
        }).join('');
    }
    return '';
}

// POST /api/chat
// Handles streaming chat completions
export async function POST(req: Request) {
    const auth = await getServerSession(authOptions);
    if (!auth) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const payload = await req.json();
        // Retrieve sessionId from the body
        const { sessionId, parentId, messages: incomingMessages, content } = payload;

        if (!sessionId) {
            return new NextResponse("Session ID is required", { status: 400 });
        }

        const chatSession = await db.chat_Sessions.findUnique({
            where: { id: sessionId },
        });

        if (!chatSession || chatSession.user !== auth.user.id) {
            return new NextResponse("Session Not Found", { status: 404 });
        }

        // Build conversation for the model
        // Handles both AI SDK 5.x UIMessage (parts array) and legacy ModelMessage (content string) formats
        let modelMessages: { role: "system" | "user" | "assistant"; content: string }[] = [];
        let lastUserContent = content;

        if (incomingMessages && Array.isArray(incomingMessages)) {
            // Convert incoming messages to ModelMessage format (content string)
            modelMessages = incomingMessages
                .filter((m: any) => m.role && (m.content || m.parts)) // Filter out empty messages
                .map((m: any) => ({
                    role: m.role as "system" | "user" | "assistant",
                    content: extractMessageContent(m),
                }))
                .filter((m: any) => m.content); // Filter out messages with empty content
            
            // Find the last user message content
            const lastUserMessage = [...incomingMessages].reverse().find((m: any) => m.role === "user");
            if (!lastUserContent && lastUserMessage) {
                lastUserContent = extractMessageContent(lastUserMessage);
            }
        } else if (content) {
            modelMessages = [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content },
            ];
        } else {
            return new NextResponse("No content or messages provided", { status: 400 });
        }

        // Ensure we have valid messages
        if (modelMessages.length === 0 || !lastUserContent) {
            return new NextResponse("No valid messages to process", { status: 400 });
        }

        // Create user message if the session is not temporary
        let userMessageId: string | null = null;
        if (!chatSession.isTemporary && lastUserContent) {
            const userMessage = await db.chat_Messages.create({
                data: {
                    session: sessionId,
                    parent: parentId,
                    role: "user",
                    content: lastUserContent,
                    model: undefined,
                    deployment: process.env.AZURE_OPENAI_DEPLOYMENT || undefined,
                },
            });
            userMessageId = userMessage.id;
            await db.chat_Sessions.update({
                where: { id: sessionId },
                data: { updatedAt: new Date() },
            });
        }

        // Call Azure OpenAI (or fallback OpenAI) with streaming
        const model = await getAiSdkModel(auth.user.id);
        if (!model) {
            return new NextResponse("No openai key found", { status: 500 });
        }

        let result: any;
        try {
            // Omit temperature for reasoning models (o1, etc.)
            const temperature = isReasoningModel(model.modelId) ? undefined : 1.0;

            const textStreamPromise = streamText({
                model,
                messages: modelMessages,
                temperature,
                onFinish: async ({ text: completion }) => {
                    try {
                        if (!chatSession.isTemporary) {
                            await db.chat_Messages.create({
                                data: {
                                    session: sessionId,
                                    parent: userMessageId || parentId || undefined,
                                    role: "assistant",
                                    content: completion,
                                    model: undefined,
                                    deployment: process.env.AZURE_OPENAI_DEPLOYMENT || undefined,
                                },
                            });
                            await db.chat_Sessions.update({
                                where: { id: sessionId },
                                data: { updatedAt: new Date() },
                            });
                        }
                    } catch (e) {
                        console.error("[CHAT_MESSAGES_ON_COMPLETION_SAVE_ERROR]", e);
                    }
                },
            });

            // Handle both promise and sync return (SDK robust handling)
            if (textStreamPromise instanceof Promise) {
                result = await textStreamPromise;
            } else {
                result = textStreamPromise;
            }
        } catch (err) {
            console.error("[CHAT_STREAM_TEXT_ERROR]", err);
            return new NextResponse("Error calling streamText", { status: 500 });
        }

        // Attempt to use known response methods
        if (result && typeof result.toDataStreamResponse === 'function') {
            return result.toDataStreamResponse();
        } else if (result && typeof result.toTextStreamResponse === 'function') {
            return result.toTextStreamResponse();
        } else if (result instanceof Response) {
            return result;
        } else {
            console.error("[CHAT_STREAM_ERROR] Invalid result object:", result);
            return new NextResponse("Stream generation failed: Invalid result", { status: 500 });
        }

    } catch (error) {
        console.error("[CHAT_MESSAGES_POST]", error);
        return new NextResponse("Failed to process message", { status: 500 });
    }
}
