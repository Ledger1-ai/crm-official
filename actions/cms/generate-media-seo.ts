"use server";

import { getAiSdkModel, isReasoningModel } from "@/lib/openai";
import { generateObject } from "ai";
import { z } from "zod";

export async function generateMediaSEO(filename: string, existingContext?: string) {
    const model = await getAiSdkModel("system");
    if (!model) {
        throw new Error("AI model not configured");
    }

    const prompt = `
    You are an expert SEO Content Generator.
    Your goal is to generate optimized metadata for a media asset based on its filename and potentially some context.
    
    Filename: "${filename}"
    Context: "${existingContext || 'No description provided'}"
    
    Fields required:
    - title: A clean, descriptive title for the image (capitalized, no extension).
    - altText: A descriptive alt text optimized for accessibility and SEO.
    - caption: A short, engaging caption suitable for a blog or gallery.
    - description: A longer description of what the image likely represents or how it could be used.
  `;

    try {
        const { object } = await generateObject({
            model,
            schema: z.object({
                title: z.string().describe("A clean, descriptive title for the image."),
                altText: z.string().describe("Descriptive alt text optimized for accessibility and SEO."),
                caption: z.string().describe("A short, engaging caption."),
                description: z.string().describe("A longer description of the image."),
            }),
            messages: [
                { role: "system", content: "You are a helpful AI assistant that generates metadata." },
                { role: "user", content: prompt },
            ],
            temperature: isReasoningModel(model.modelId) ? undefined : 1,
        });

        return object;
    } catch (error) {
        console.error("Error generating media SEO:", error);
        throw new Error("Failed to generate metadata");
    }
}
