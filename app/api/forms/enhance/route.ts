import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getAiSdkModel } from "@/lib/openai";
import { generateObject } from "ai";
import { z } from "zod";

// Define the form field schema - must match Prisma FormFieldType enum exactly
const FormFieldSchema = z.object({
    name: z.string().describe("Field name in snake_case"),
    label: z.string().describe("Human-readable label"),
    field_type: z.enum(["TEXT", "TEXTAREA", "EMAIL", "PHONE", "NUMBER", "SELECT", "MULTI_SELECT", "CHECKBOX", "RADIO", "DATE", "TIME", "DATETIME", "FILE", "HIDDEN"]),
    placeholder: z.string().nullable().optional().describe("Placeholder text"),
    help_text: z.string().nullable().optional().describe("Help text shown below the field"),
    is_required: z.boolean().default(false),
    lead_field_mapping: z.enum(["email", "phone", "firstName", "lastName", "name", "company", "website", "address", "city", "state", "zip", "country"]).nullable().optional().describe("Map to CRM lead field"),
    options: z.array(z.string()).nullable().optional().describe("Options for SELECT/RADIO/MULTI_SELECT fields"),
    position: z.number(),
});

// Define the complete form schema
const FormConfigSchema = z.object({
    name: z.string().describe("Form name"),
    description: z.string().nullable().optional().describe("Form description"),
    visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
    fields: z.array(FormFieldSchema).describe("Form fields"),
});

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { formConfig, prompt } = body;

        // Get the AI model configured for this user/team
        const model = await getAiSdkModel(session.user.id);

        // Build the system prompt
        const systemPrompt = `You are a form design expert specializing in lead capture forms for CRM systems.
Your task is to generate or enhance form configurations that are:
- User-friendly with clear labels and helpful placeholders
- Comprehensive for lead capture (email, phone, name, company, etc.)
- Properly mapped to CRM lead fields for automatic data import
- Concise - only include necessary fields

Available field types: TEXT, TEXTAREA, EMAIL, PHONE, NUMBER, SELECT, MULTI_SELECT, CHECKBOX, RADIO, DATE, TIME, DATETIME, FILE, HIDDEN
Note: Use TEXT for URL/website fields with appropriate validation
Available lead field mappings: email, phone, firstName, lastName, name, company, website, address, city, state, zip, country`;

        // Build the user prompt based on whether we're enhancing or generating
        let userPrompt: string;

        if (prompt && !formConfig?.fields?.length) {
            // Generate new form from description
            userPrompt = `Generate a lead capture form for: ${prompt}
            
Create a professional form with appropriate fields for this use case. Include:
- Relevant fields for this type of form
- Proper field types (use EMAIL for emails, PHONE for phones, etc.)
- Required fields marked appropriately
- Lead field mappings where applicable
- Helpful placeholder text
- A descriptive form name and description`;
        } else if (prompt) {
            // Enhance existing form with guidance
            userPrompt = `Enhance this form configuration based on the following guidance: ${prompt}

Current form:
${JSON.stringify(formConfig, null, 2)}

Apply the requested changes while maintaining the form's structure. Add placeholders, help text, and any missing fields as needed.`;
        } else {
            // Enhance existing form without specific guidance
            userPrompt = `Enhance this form configuration to make it more comprehensive and user-friendly:

${JSON.stringify(formConfig, null, 2)}

Improvements to make:
- Add helpful placeholder text to all fields
- Add help_text for any complex fields
- Ensure all fields have proper lead_field_mapping where applicable
- Mark essential fields as required
- Improve labels for clarity`;
        }

        // Use generateObject with schema for guaranteed JSON output
        const { object: enhanced } = await generateObject({
            model,
            schema: FormConfigSchema,
            system: systemPrompt,
            prompt: userPrompt,
        });

        // Ensure positions are sequential
        enhanced.fields = enhanced.fields.map((f, i) => ({
            ...f,
            position: i,
        }));

        return NextResponse.json({ enhanced });
    } catch (error) {
        console.error("Error enhancing form:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
