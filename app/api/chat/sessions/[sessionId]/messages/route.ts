// Force Rebuild
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadbChat } from "@/lib/prisma-chat";
const db: any = prismadbChat;
import { getAiSdkModel, isReasoningModel } from "@/lib/openai";
import { streamText } from "ai";

type Params = {
  params: { sessionId: string };
};

// GET /api/chat/sessions/:sessionId/messages
// Returns all messages in a session, ordered chronologically.
export async function GET(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { sessionId } = await params;

  try {
    const chatSession = await db.chat_Sessions.findUnique({
      where: { id: sessionId },
    });

    if (!chatSession || chatSession.user !== session.user.id) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const where: any = { session: sessionId };
    const messages = await db.chat_Messages.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error("[CHAT_MESSAGES_GET]", error);
    return new NextResponse("Failed to fetch messages", { status: 500 });
  }
}

// POST /api/chat/sessions/:sessionId/messages
export async function POST(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const auth = await getServerSession(authOptions);
  if (!auth) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { sessionId } = await params;

  try {
    const payload = await req.json();
    const parentId: string | undefined = payload.parentId;
    const incomingMessages: { role: "user" | "assistant" | "system"; content: string }[] | undefined =
      payload.messages;
    const content: string | undefined = payload.content;

    const chatSession = await db.chat_Sessions.findUnique({
      where: { id: sessionId },
    });

    if (!chatSession || chatSession.user !== auth.user.id) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Build conversation for the model
    let modelMessages: { role: "system" | "user" | "assistant"; content: string }[] = [];
    let lastUserContent = content;

    if (incomingMessages && Array.isArray(incomingMessages)) {
      modelMessages = incomingMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })) as any;
      const last = [...incomingMessages].reverse().find((m) => m.role === "user");
      if (!lastUserContent && last) {
        lastUserContent = last.content;
      }
    } else if (content) {
      modelMessages = [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content },
      ];
    } else {
      return new NextResponse("No content or messages provided", { status: 400 });
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
      const temperature = isReasoningModel(model.modelId) ? undefined : 1;

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
