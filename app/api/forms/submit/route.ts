import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import crypto from "crypto";

// Public endpoint - no auth required
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { form_slug, data, source_url, referrer, utm_source, utm_medium, utm_campaign } = body;

        if (!form_slug) {
            return NextResponse.json({ error: "Form slug required" }, { status: 400 });
        }

        if (!data || typeof data !== "object") {
            return NextResponse.json({ error: "Form data required" }, { status: 400 });
        }

        // Find the form
        const form = await (prismadb as any).form.findUnique({
            where: { slug: form_slug },
            include: {
                fields: true,
            },
        });

        if (!form) {
            return NextResponse.json({ error: "Form not found" }, { status: 404 });
        }

        if (form.status !== "ACTIVE") {
            return NextResponse.json({ error: "Form is not active" }, { status: 400 });
        }

        // Validate required fields
        for (const field of form.fields) {
            if (field.is_required && field.is_visible) {
                const value = data[field.name];
                if (value === undefined || value === null || value === "") {
                    return NextResponse.json({
                        error: `Field "${field.label}" is required`
                    }, { status: 400 });
                }
            }
        }

        // Extract lead info based on field mappings
        let extracted_email: string | null = null;
        let extracted_phone: string | null = null;
        let extracted_name: string | null = null;
        let extracted_company: string | null = null;

        for (const field of form.fields) {
            if (field.lead_field_mapping && data[field.name]) {
                switch (field.lead_field_mapping) {
                    case "email":
                        extracted_email = data[field.name];
                        break;
                    case "phone":
                        extracted_phone = data[field.name];
                        break;
                    case "firstName":
                    case "lastName":
                    case "name":
                        extracted_name = extracted_name
                            ? `${extracted_name} ${data[field.name]}`
                            : data[field.name];
                        break;
                    case "company":
                        extracted_company = data[field.name];
                        break;
                }
            }
        }

        // Hash IP for privacy
        const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
        const ip_hash = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
        const user_agent = req.headers.get("user-agent") || undefined;

        // Create submission
        const submission = await (prismadb as any).formSubmission.create({
            data: {
                form_id: form.id,
                data,
                extracted_email,
                extracted_phone,
                extracted_name,
                extracted_company,
                status: "NEW",
                source_url,
                ip_hash,
                user_agent,
                referrer,
                utm_source,
                utm_medium,
                utm_campaign,
                team_id: form.team_id,
            },
        });

        // Increment form submission count
        await (prismadb as any).form.update({
            where: { id: form.id },
            data: { submission_count: { increment: 1 } },
        });

        // TODO: Send notification emails if configured
        // TODO: Call webhook if configured

        return NextResponse.json({
            success: true,
            message: form.success_message || "Thank you for your submission!",
            redirect_url: form.redirect_url,
        });
    } catch (error) {
        console.error("Error submitting form:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// Allow CORS for public form submissions
export async function OPTIONS(req: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}
