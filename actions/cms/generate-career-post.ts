"use server";

import { getAiSdkModel, isReasoningModel } from "@/lib/openai";
import { generateObject } from "ai";
import { z } from "zod";

export async function generateCareerPost(jobTitle: string) {
    const model = await getAiSdkModel("system");
    if (!model) {
        throw new Error("AI model not configured");
    }

    const prompt = `
    You are an expert HR Specialist and Recruiter for Ledger1CRM.
    Your goal is to write a compelling, inclusive, and professional job description for the role: "${jobTitle}".
    
    Content Requirements:
    1.  Structure:
        -   Job Summary: High-level overview of the role and its impact.
        -   Responsibilities: Bulleted list of key duties (5-7 items).
        -   Requirements: Bulleted list of must-have skills and qualifications.
        -   Nice-to-Haves: Optional but preferred skills.
        -   Benefits & Perks: What we offer (remote work, healthcare, etc.).
        -   Company Culture: Brief description of our values.
    2.  Tone & Style:
        -   Professional, welcoming, and exciting.
        -   Use inclusive language.
        -   Focus on growth and impact.
    3.  Formatting:
        -   Use H2s for section headers.
        -   Use bullet points for lists.
    `;

    try {
        const { object } = await generateObject({
            model,
            schema: z.object({
                title: z.string().describe("The official job title, optimized for search."),
                department: z.string().describe("The department this role belongs to (e.g., Engineering, Sales, Marketing)."),
                location: z.string().describe("Remote, Hybrid, or specific location."),
                employmentType: z.enum(["Full-time", "Part-time", "Contract", "Internship"]).describe("Type of employment."),
                content: z.string().describe("The full job description in clean Markdown."),
            }),
            messages: [
                { role: "system", content: "You are a helpful AI assistant that generates job descriptions." },
                { role: "user", content: prompt },
            ],
            temperature: isReasoningModel(model.modelId) ? undefined : 1,
        });

        return object;
    } catch (error) {
        console.error("Error generating career post:", error);
        throw new Error("Failed to generate career post");
    }
}
