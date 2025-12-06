"use server";

import { AzureOpenAI } from "openai";

export async function generateCareerPost(topic: string) {
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
    You are an expert HR Recruitment Specialist for Ledger1CRM.
    Your goal is to write a compelling, professional job description for the role: "${topic}".

    Return the response as a **valid JSON object** with the following fields:
    - title: A professional job title.
    - department: E.g., Engineering, Sales, Marketing, Customer Success.
    - location: E.g., Remote, San Francisco, London.
    - type: "Full-time", "Part-time", "Contract".
    - summary: A short, engaging summary of the role (150-200 chars).
    - content: The full job description in clean Markdown.

    **Content Requirements:**
    1.  **Structure**:
        -   **Role Overview**: Why this role matters.
        -   **Key Responsibilities**: Bullet points of what they will do.
        -   **Qualifications**: What we're looking for (Must-haves and Nice-to-haves).
        -   **Why Join Us**: Benefits and culture.
    2.  **Tone & Style**:
        -   Professional, inclusive, and exciting.
        -   Highlight innovation and growth.
    
    **IMPORTANT**: Return ONLY the raw JSON string. Do not wrap it in markdown code blocks or any other formatting.
  `;

    try {
        const response = await client.chat.completions.create({
            model: deployment,
            messages: [
                { role: "system", content: "You are a helpful AI assistant that generates job descriptions in JSON format." },
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
        console.error("Error generating career post:", error);
        throw new Error("Failed to generate career post");
    }
}
