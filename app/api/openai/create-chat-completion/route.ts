
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma"; // Use lib/prisma explicitly
import { getAiClient } from "@/lib/ai-helper"; // We'll create this next
import { createDataStreamResponse, streamText } from 'ai';

export const maxDuration = 300; // 5 minutes

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { messages, modelId } = await req.json();

    // 1. Get User Team
    const user = await prismadb.users.findUnique({
      where: { email: session.user.email },
      include: { assigned_team: true }
    });

    if (!user?.assigned_team) {
      return new NextResponse("Team not found", { status: 400 });
    }

    // 2. Get AI Client (Unified)
    const { client, model, provider } = await getAiClient(user.assigned_team.id);

    // 3. Create Stream
    // Note: 'model' from getAiClient is already the instantiated provider model (e.g. openai("gpt-4o"))

    // Check if we need to track usage/pricing (TODO)

    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: model,
          messages,
          maxSteps: 5, // Optional: for tool usage
        });
        result.mergeIntoDataStream(dataStream);
      },
    });

  } catch (error) {
    console.log("[CHAT_COMPLETION]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
