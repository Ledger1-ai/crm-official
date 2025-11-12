import { authOptions } from "@/lib/auth";
import { openAiHelper } from "@/lib/openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { getServerSession } from "next-auth";

// IMPORTANT! Set the runtime to edge
//export const runtime = "edge";

export async function POST(req: Request) {
  // Extract the `prompt` from the body of the request
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const openai = await openAiHelper(session.user.id);

  if (!openai) {
    const errorResponse = new Response("No openai key found", { status: 500 });
    const stream = OpenAIStream(errorResponse);
    return new StreamingTextResponse(stream);
  }

  //console.log(session, "session");

  const { prompt } = await req.json();

  // Ask OpenAI (or Azure OpenAI via helper) for a streaming chat completion given the prompt
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const modelToUse =
    azureEndpoint && azureDeployment ? azureDeployment : "gpt-3.5-turbo";

  const response = await openai.chat.completions.create({
    model: modelToUse,
    stream: true,
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt },
    ],
    // max_tokens: 2000,
  });

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);

  // Respond with the stream
  return new StreamingTextResponse(stream);
}
