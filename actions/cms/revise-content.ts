"use server";

import { AzureOpenAI } from "openai";

export async function reviseContent(
    content: string,
    instruction: string,
    type: "blog" | "docs" | "career"
) {
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
    switch (type) {
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
    
    You will be provided with existing content and an instruction on how to revise it.
    
    **Instruction**: "${instruction}"
    
    **Existing Content**:
    """
    ${content}
    """
    
    Return the **revised content** in Markdown format.
    Do NOT include any explanations, preambles, or conversational text. Just the revised content.
    `;

    try {
        const response = await client.chat.completions.create({
            model: deployment,
            messages: [
                { role: "system", content: "You are a helpful AI editor." },
                { role: "user", content: prompt },
            ],
            temperature: 0.7, // Lower temperature for revision to stick closer to intent
        });

        const revisedContent = response.choices[0].message.content;
        if (!revisedContent) {
            throw new Error("No content generated");
        }

        return revisedContent;
    } catch (error) {
        console.error("Error revising content:", error);
        throw new Error("Failed to revise content");
    }
}
