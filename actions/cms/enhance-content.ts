"use server";

import { AzureOpenAI } from "openai";

interface EnhanceContext {
    title: string;
    content: string;
    category: string;
    type: "docs" | "blog" | "career";
}

interface EnhanceResult {
    title?: string;
    content?: string;
    category?: string;
    summary?: string; // For blog/careers
}

export async function enhanceContent(
    context: EnhanceContext,
    instruction: string
): Promise<EnhanceResult> {
    if (!process.env.AZURE_OPENAI_API_KEY || !process.env.AZURE_OPENAI_ENDPOINT) {
        throw new Error("Azure OpenAI credentials not configured");
    }

    const client = new AzureOpenAI({
        apiKey: process.env.AZURE_OPENAI_API_KEY,
        apiVersion: process.env.AZURE_OPENAI_API_VERSION || "2025-01-01-preview",
        endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    });

    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-5";

    let roleDescription = "";
    switch (context.type) {
        case "blog":
            roleDescription = "Expert SEO Content Writer";
            break;
        case "docs":
            roleDescription = "Expert Technical Writer";
            break;
        case "career":
            roleDescription = "Expert HR & Recruitment Specialist";
            break;
    }

    const prompt = `
    You are an ${roleDescription}.
    
    You are provided with a ${context.type} post draft.
    
    **Current Context**:
    - Title: "${context.title}"
    - Category: "${context.category}"
    - Content: 
    """
    ${context.content}
    """
    
    **User Instruction**: "${instruction}"
    
    **Style Guidelines**:
    -   Use **Github Flavored Markdown (GFM)**.
    -   Use **bold** for UI elements, buttons, and field names.
    -   Use *italics* for emphasis.
    -   Use \`code blocks\` with language specification (e.g., \`\`\`typescript) for code.
    -   Use > blockquotes for important notes or warnings.
    -   Ensure headers (#, ##, ###) are strictly hierarchical.
    -   Use - or * for bullet points.
    
    Based on the instruction and the current context, please revise the content. You may update the Title, Content, or Category if the instruction implies it (e.g., "Fix the title" or "Rewrite for clarity").
    
    Return a **valid JSON object** with the following fields (include only fields that changed):
    - title: (Optional) Revised title
    - content: (Optional) Revised content in Markdown
    - category: (Optional) Revised category
    
    **IMPORTANT**: Return ONLY the raw JSON string.
    `;

    try {
        const response = await client.chat.completions.create({
            model: deployment,
            messages: [
                { role: "system", content: "You are a helpful AI editor that outputs JSON." },
                { role: "user", content: prompt },
            ],
            temperature: 1,
            response_format: { type: "json_object" },
        });

        const result = response.choices[0].message.content;
        if (!result) {
            throw new Error("No content generated");
        }

        return JSON.parse(result);
    } catch (error: any) {
        console.error("Error enhancing content:", error);
        throw new Error(`Failed to enhance content: ${error.message || error}`);
    }
}
