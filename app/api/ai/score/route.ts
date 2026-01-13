import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAiSdkModel } from "@/lib/openai";
import { generateObject } from "ai";
import { z } from "zod";

// Define schema for the generic score result
const ScoreSchema = z.object({
    score: z.number().min(0).max(100).describe("A score from 0-100 indicating quality/probability/urgency."),
    label: z.string().describe("A short label for the score (e.g., 'High Quality', 'Low Probability')."),
    color: z.enum(["red", "yellow", "green"]).describe("Visual color indicator."),
    reasoning: z.string().describe("Brief explanation of why this score was assigned."),
    key_factors: z.array(z.string()).describe("List of 3-5 key factors influencing the score."),
});

export async function POST(req: Request) {
    const auth = await getServerSession(authOptions);
    if (!auth) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { type, data, context } = await req.json();

        if (!type || !data) {
            return new NextResponse("Missing type or data", { status: 400 });
        }

        const model = await getAiSdkModel(auth.user.id);
        if (!model) {
            return new NextResponse("AI Model not configured", { status: 500 });
        }

        let systemPrompt = "";
        let userPrompt = "";

        // CONFIGURATION BASED ON TYPE
        if (type === "LEAD_QUALIFICATION") {
            systemPrompt = `You are a Lead Qualification Expert. Analyze the lead data and assign a Quality Score (0-100).
        High Score Criteria:
        - Clear, professional job title and company.
        - Direct contact info present.
        - Specific, high-value source or description.
        
        Low Score Criteria:
        - Generic email, missing fields.
        - Vague or Spam-like traits.`;
            userPrompt = `Analyze this lead:\n${JSON.stringify(data, null, 2)}`;
        }
        else if (type === "OPPORTUNITY_WIN_PROB") {
            systemPrompt = `You are a Sales Forecaster. Estimate the Win Probability (0-100) for this opportunity.
        Consider:
        - Stage (closer to close = higher, but adjust for risk).
        - Activity recency (stale = lower).
        - Description quality.`;
            userPrompt = `Analyze this opportunity:\n${JSON.stringify(data, null, 2)}\nContext: ${context || ""}`;
        }
        else if (type === "EMAIL_URGENCY") {
            systemPrompt = `You are an Executive Assistant. Rate the Urgency (0-100) of this email.
        High Urgency:
        - Mentions deadlines, problems, errors, or high-value terms.
        - From important domains (if visible).
        Low Urgency:
        - Newsletters, automated updates, cold outreach.`;
            userPrompt = `Analyze this email:\n${JSON.stringify(data, null, 2)}`;
        }
        else {
            return new NextResponse("Invalid score type", { status: 400 });
        }

        const { object } = await generateObject({
            model,
            schema: ScoreSchema,
            prompt: userPrompt,
            system: systemPrompt,
        });

        return NextResponse.json(object);

    } catch (error) {
        console.error("[AI_SCORE_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
