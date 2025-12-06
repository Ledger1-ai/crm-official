"use server";

import { AzureOpenAI } from "openai";

export async function generateBlogPost(topic: string) {
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
    You are an expert SEO Content Writer for Ledger1CRM, a leading CRM platform powered by AI.
    Your goal is to write a high-ranking, authoritative, and engaging blog post on the topic: "${topic}".

    Return the response as a **valid JSON object** with the following fields:
    - title: A catchy, high-CTR title (60 chars max) that includes the main keyword.
    - slug: A URL-friendly slug based on the title.
    - excerpt: A compelling meta description (150-160 chars) optimized for clicks.
    - category: Choose the most relevant category: "Sales AI", "CRM Strategy", "Automation", "Future of Work".
    - content: The full blog post in clean Markdown.

    **Content Requirements:**
    1.  **Structure**:
        -   **Introduction**: Hook the reader immediately. Define the problem and promise a solution.
        -   **Key Takeaways**: A bulleted list of 3-4 main points right after the intro.
        -   **Deep Dive Sections**: Use H2s for main sections and H3s for subsections.
        -   **"People Also Ask"**: Include a section answering 3 common questions related to the topic.
        -   **Conclusion**: Summarize and provide a final thought.
    2.  **SEO Strategy**:
        -   Include the main keyword "${topic}" naturally in the first 100 words.
        -   Use semantic LSI keywords related to CRM, AI, sales automation, and business growth.
        -   Optimize for Featured Snippets (short, direct answers to questions).
    3.  **Tone & Style**:
        -   Professional yet accessible (Grade 8-10 readability).
        -   Authoritative but helpful.
        -   Avoid fluff and generic AI phrases (e.g., "In the rapidly evolving landscape..."). Be direct.
    4.  **Formatting**:
        -   Use **bold** for emphasis on key phrases.
        -   Use bullet points and numbered lists to break up text.
        -   Keep paragraphs short (2-3 sentences).
    5.  **Call to Action (CTA)**:
        -   End with a strong CTA encouraging readers to try Ledger1CRM to solve their sales challenges.

    **IMPORTANT**: Return ONLY the raw JSON string. Do not wrap it in markdown code blocks or any other formatting.
  `;

    try {
        const response = await client.chat.completions.create({
            model: deployment,
            messages: [
                { role: "system", content: "You are a helpful AI assistant that generates blog content in JSON format." },
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
        console.error("Error generating blog post:", error);
        throw new Error("Failed to generate blog post");
    }
}
