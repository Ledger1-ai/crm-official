"use server";

import { AzureOpenAI } from "openai";

export async function generateDocPost(topic: string) {
    if (!process.env.AZURE_OPENAI_API_KEY || !process.env.AZURE_OPENAI_ENDPOINT) {
        throw new Error("Azure OpenAI credentials not configured");
    }

    const client = new AzureOpenAI({
        apiKey: process.env.AZURE_OPENAI_API_KEY,
        apiVersion: process.env.AZURE_OPENAI_API_VERSION || "2025-01-01-preview",
        endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    });

    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-5";

    const prompt = `
    You are an expert Technical Writer for Ledger1CRM.
    Your goal is to write clear, concise, and helpful documentation on the topic: "${topic}".

    Return the response as a **valid JSON object** with the following fields:
    - title: A clear, descriptive title.
    - slug: A URL-friendly slug based on the title.
    - category: Choose the most relevant category: "Getting Started", "Configuration", "API Reference", "Troubleshooting", "Integrations".
    - content: The full documentation article in clean Markdown.

    **Content Requirements:**
    1.  **Structure**:
        -   **Overview**: Briefly explain what this guide covers and why it's important.
        -   **Prerequisites**: Bullet points of what is needed before starting (if applicable).
        -   **Step-by-Step Guide**: Use numbered lists for instructions. Be specific.
        -   **Troubleshooting / FAQ**: Common issues users might face.
        -   **Next Steps**: Where to go from here.
    2.  **Tone & Style**:
        -   Technical, precise, and objective.
        -   Use "You" to address the user.
        -   Avoid marketing fluff.
    3.  **Formatting**:
        -   Use **bold** for UI elements (buttons, field names).
        -   Use code blocks for commands or code snippets.
    
    **IMPORTANT**: Return ONLY the raw JSON string. Do not wrap it in markdown code blocks or any other formatting.
  `;

    try {
        const response = await client.chat.completions.create({
            model: deployment,
            messages: [
                { role: "system", content: "You are a helpful AI assistant that generates technical documentation in JSON format." },
                { role: "user", content: prompt },
            ],
            temperature: 1,
            response_format: { type: "json_object" },
        });

        const content = response.choices[0].message.content;
        if (!content) {
            throw new Error("No content generated");
        }

        return JSON.parse(content);
    } catch (error) {
        console.error("Error generating doc post:", error);
        throw new Error("Failed to generate doc post");
    }
}
