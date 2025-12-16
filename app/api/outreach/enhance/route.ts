import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const endpoint = process.env.AZURE_OPENAI_ENDPOINT || "";
const apiKey = process.env.AZURE_OPENAI_API_KEY || "";
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o";
const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview";

/**
 * POST /api/outreach/enhance
 * 
 * AI text enhancement for various fields in the outreach wizard.
 * Supports different enhancement types:
 * - "briefing": Expand and improve product briefing
 * - "description": Clean up and improve campaign description
 * - "preferences": Improve meeting preferences
 * - "prompt": Generate a unique, powerful AI prompt template
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { type, content, context } = body;

        if (!type || typeof content !== "string") {
            return NextResponse.json({ error: "Missing type or content" }, { status: 400 });
        }

        // Call Azure OpenAI directly
        const apiUrl = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

        let systemPrompt = "";
        let userPrompt = "";

        switch (type) {
            case "briefing":
                systemPrompt = `You are an expert product marketer and pitch writer. Your job is to take rough product/project notes and transform them into a compelling, detailed briefing that will help AI generate personalized outreach emails.

The briefing should:
- Be structured with bullet points for clarity
- Include key innovations and differentiators
- Highlight market opportunity
- Include traction metrics if mentioned
- Be comprehensive but concise (300-500 words ideal)
- Use compelling, confident language without being overly salesy
- Focus on value propositions that would resonate with investors/prospects

Return ONLY the improved briefing text, no explanations.`;
                userPrompt = `Improve and expand this product/project briefing:\n\n${content}${context?.productName ? `\n\nProduct Name: ${context.productName}` : ""}${context?.companyName ? `\nCompany: ${context.companyName}` : ""}`;
                break;

            case "description":
                systemPrompt = `You are a professional copywriter. Clean up and improve the following campaign description to be clear, professional, and compelling. Keep it concise (2-3 sentences max). Return ONLY the improved text.`;
                userPrompt = `Improve this campaign description:\n\n${content}`;
                break;

            case "preferences":
                systemPrompt = `You are a professional business writer. Improve the following meeting preferences to be clear, professional, and easy to understand. Structure as bullet points. Return ONLY the improved text.`;
                userPrompt = `Improve these meeting preferences:\n\n${content}`;
                break;

            case "prompt":
                // Generate a unique, powerful prompt based on the current populated template
                // IMPORTANT: Keep populated values like "Krishna Patel" - only use placeholders for LEAD data
                systemPrompt = `You are an expert prompt engineer specializing in email outreach automation. Your task is to IMPROVE and ENHANCE the current prompt template.

CRITICAL RULES:
1. KEEP all the populated values in the template (like specific names, companies, products, briefings)
2. Only use placeholders for LEAD-SPECIFIC data that changes per recipient:
   - {LEAD_NAME}, {LEAD_COMPANY}, {LEAD_TITLE}, {LEAD_EMAIL_USERNAME}, {LEAD_TYPE}, {LEAD_LOCATION}
   - {COMPANY_RESEARCH} (this is auto-gathered per lead)
3. DO NOT replace populated values with placeholders like {USER_NAME} - keep the actual values!
4. Improve the voice, structure, and requirements to be more compelling
5. Make the prompt more industry-specific and targeted
6. Add creative personalization requirements

Example of what TO DO:
- If the template says "You are Krishna Patel", keep it as "You are Krishna Patel"
- If it has product briefing text, keep that actual text

Example of what NOT TO DO:
- DO NOT replace "Krishna Patel" with "{USER_NAME}"
- DO NOT replace "The Utility Company" with "{COMPANY_NAME}"
- DO NOT replace the actual briefing content with "{PROJECT_BRIEFING}"

Return ONLY the improved prompt template text, ready to use.`;
                userPrompt = `Here is the current populated prompt template. Improve it while KEEPING all the specific values:

---
${content}
---

Additional Context:
- Product: ${context?.productName || "See template"}
- Company: ${context?.companyName || "See template"}  
- User: ${context?.userName || "See template"}
- Campaign Name: ${context?.campaignName || "Outreach Campaign"}
- Number of Leads: ${context?.leadsCount || "Multiple leads"}

Improve this prompt to:
1. Have a more unique and compelling voice/persona specific to this product
2. Add more detailed requirements for personalization
3. Include industry-specific angles if applicable
4. Make the output requirements more precise
5. Add creative hooks and CTA suggestions

REMEMBER: Keep all the actual values (names, companies, briefings) - only use {LEAD_*} and {COMPANY_RESEARCH} placeholders for per-lead data!`;
                break;

            default:
                return NextResponse.json({ error: "Invalid enhancement type" }, { status: 400 });
        }

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": apiKey,
            },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                // temperature: 0.8,
                // max_tokens: 2000,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Azure OpenAI error: ${response.status} - ${errorText}`);
        }

        const completion = await response.json();
        const enhanced = completion.choices?.[0]?.message?.content?.trim() || content;

        return NextResponse.json({ enhanced }, { status: 200 });
    } catch (error: any) {
        console.error("[OUTREACH_ENHANCE]", error);
        return NextResponse.json(
            { error: error.message || "Failed to enhance text" },
            { status: 500 }
        );
    }
}

// Reference template for prompt generation
const DEFAULT_PROMPT_REFERENCE = `Persona:
You are {USER_NAME} — {USER_TITLE} at {COMPANY_NAME} and creator of {PRODUCT_NAME}. Write entirely in first person (I/me); never refer to yourself in third person. Your voice is principled builder, analytical and candid, confident but not salesy.

Goal:
Craft a personalized outreach email about {PRODUCT_NAME} tailored to the recipient, using any available firm/company research.

Voice and Style:
- Narrative, insight-driven prose; no section headings or bullet points in the email body.
- Avoid phrases like "Founder note".
- Be concise, confident, and specific; show operator depth and strategic clarity.

{PRODUCT_NAME} Briefing (context for personalization):
{PROJECT_BRIEFING}

Meeting Preferences (embed naturally in CTA):
{MEETING_PREFERENCES}

Contact Information:
- Name: {LEAD_NAME}
- Firm: {LEAD_COMPANY}
- Title: {LEAD_TITLE}

Company Research:
{COMPANY_RESEARCH}

Requirements:
- Output JSON ONLY with keys "subject" and "body"
- Body MUST be plain text (no HTML)
- Length: 250–300 words
- Open with a hook tied to their work
- Personalize based on their focus
- End with a confident CTA

Return EXACTLY this JSON object:
{
  "subject": "<compelling personalized subject>",
  "body": "<plain text body with paragraph breaks>"
}`;
