import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseICPFromNaturalLanguage } from "@/lib/scraper/ai-helpers";

/**
 * POST /api/leads/parse-icp
 * Parse natural language prompt into structured ICP configuration
 * Body: { prompt: string }
 * Response: { industries: string[], geos: string[], titles: string[], etc. }
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    console.log("[PARSE_ICP] Parsing natural language prompt...");
    
    const parsed = await parseICPFromNaturalLanguage(
      prompt.trim(),
      session.user.id
    );

    console.log("[PARSE_ICP] Parsing complete:", parsed);

    return NextResponse.json(parsed, { status: 200 });
  } catch (error) {
    console.error("[PARSE_ICP_POST]", error);
    return new NextResponse("Failed to parse ICP", { status: 500 });
  }
}
