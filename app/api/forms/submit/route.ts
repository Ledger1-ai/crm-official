import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { format } from "date-fns";
import crypto from "crypto";
import sendEmail from "@/lib/sendmail";
import { sendTeamEmail } from "@/lib/email/team-mailer";
import { generateSubmissionPdf } from "@/lib/pdf-utils";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

// Public endpoint - no auth required
export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get("content-type") || "";

        // --- 1. dual Parsing Strategy ---
        let form_slug: string | null = null;
        let captcha_token: string | null = null;
        let source_url: string | null = null;
        let referrer: string | null = null;
        let utm_source: string | null = null;
        let utm_medium: string | null = null;
        let utm_campaign: string | null = null;
        let submittedData: Record<string, any> = {};
        let uploadedFiles: File[] = [];

        if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            form_slug = (formData.get("form_slug") || formData.get("form_path")) as string;
            captcha_token = formData.get("captcha_token") as string;
            source_url = formData.get("source_url") as string;
            referrer = formData.get("referrer") as string;
            utm_source = formData.get("utm_source") as string;
            utm_medium = formData.get("utm_medium") as string;
            utm_campaign = formData.get("utm_campaign") as string;

            // Extract all other fields into data
            const systemKeys = new Set(["form_slug", "form_path", "captcha_token", "source_url", "referrer", "utm_source", "utm_medium", "utm_campaign"]);

            formData.forEach((value, key) => {
                if (!systemKeys.has(key)) {
                    if (value instanceof File) {
                        uploadedFiles.push(value);
                        // We also store the filename in data for reference
                        submittedData[key] = `[FILE] ${value.name}`;
                    } else {
                        submittedData[key] = value;
                    }
                }
            });
        } else {
            // JSON fallback
            const body = await req.json();
            form_slug = body.form_slug || body.form_path;
            captcha_token = body.captcha_token;
            submittedData = body.data || {};

            // --- SMART PARSING ---
            // If submittedData is empty, assume fields are at the root level
            if (Object.keys(submittedData).length === 0) {
                const systemKeys = new Set(["form_slug", "form_path", "captcha_token", "source_url", "referrer", "utm_source", "utm_medium", "utm_campaign"]);
                Object.keys(body).forEach(key => {
                    if (!systemKeys.has(key)) {
                        submittedData[key] = body[key];
                    }
                });
            }

            source_url = body.source_url;
            referrer = body.referrer;
            utm_source = body.utm_source;
            utm_medium = body.utm_medium;
            utm_campaign = body.utm_campaign;
        }

        if (!form_slug) {
            return NextResponse.json({ error: "Form slug required" }, { status: 400, headers: corsHeaders });
        }

        // --- Slug Normalization / Aliasing ---
        // Ensure both internal and external forms point to the same DB record
        if (form_slug === "airdrop") {
            form_slug = "crecoin-airdrop-season-2";
        }

        // Find the form
        const form = await (prismadb as any).form.findUnique({
            where: { slug: form_slug },
            include: {
                fields: true,
            },
        });

        if (!form) {
            return NextResponse.json({ error: "Form not found" }, { status: 404, headers: corsHeaders });
        }

        if (form.status !== "ACTIVE") {
            return NextResponse.json({ error: "Form is not active" }, { status: 400, headers: corsHeaders });
        }

        // Verify Captcha if required
        if (form.require_captcha) {
            if (!captcha_token) {
                return NextResponse.json({ error: "Captcha verification required" }, { status: 400, headers: corsHeaders });
            }

            // Determine which keys to use
            let secretKey = form.captcha_secret_key;

            // If no form-specific key, try to fetch team config
            if (!secretKey) {
                const teamConfig = await (prismadb as any).teamCaptchaConfig.findUnique({
                    where: { team_id: form.team_id }
                });
                if (teamConfig && teamConfig.secret_key) {
                    secretKey = teamConfig.secret_key;
                }
            }

            if (!secretKey) {
                console.error(`Form ${form.id} requires captcha but has no secret key configured`);
                return NextResponse.json({ error: "Form configuration error" }, { status: 500, headers: corsHeaders });
            }

            try {
                const verifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
                const verifyRes = await fetch(verifyUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(captcha_token)}`,
                });

                const verifyData = await verifyRes.json();
                if (!verifyData.success) {
                    return NextResponse.json({ error: "Captcha verification failed" }, { status: 400, headers: corsHeaders });
                }
            } catch (error) {
                return NextResponse.json({ error: "Captcha service error" }, { status: 500, headers: corsHeaders });
            }
        }

        // Validate required fields
        for (const field of form.fields) {
            if (field.is_required && field.is_visible) {
                const value = submittedData[field.name];
                if (value === undefined || value === null || value === "") {
                    console.error(`[Form ${form.slug}] Validation Failed: Missing required field "${field.name}" (${field.label})`);
                    return NextResponse.json({
                        error: `Field "${field.label}" is required`
                    }, { status: 400, headers: corsHeaders });
                }
            }
        }

        // --- 2. File Processing (Upload to Azure + Create Documents) ---
        const createdDocumentIds: string[] = [];

        if (uploadedFiles.length > 0) {
            try {
                // Dynamically import to ensure dependency availability
                const { getBlobServiceClient } = await import("@/lib/azure-storage");
                const serviceClient = getBlobServiceClient();
                const containerName = process.env.BLOB_STORAGE_CONTAINER || "crm-uploads";
                const containerClient = serviceClient.getContainerClient(containerName);

                // Ensure container exists
                await containerClient.createIfNotExists();

                for (const file of uploadedFiles) {
                    const bytes = await file.arrayBuffer();
                    const buffer = Buffer.from(bytes);
                    const fileNameSafe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
                    // Use a generic "public_uploads" folder or similar since we don't have a logged-in user ID
                    // We can use form.team_id for organization
                    const key = `uploads/${form.team_id}/${Date.now()}_${fileNameSafe}`;

                    const blobClient = containerClient.getBlockBlobClient(key);
                    await blobClient.uploadData(buffer, {
                        blobHTTPHeaders: { blobContentType: file.type || "application/octet-stream" },
                    });

                    // Create Document Record
                    const doc = await (prismadb as any).documents.create({
                        data: {
                            document_name: file.name,
                            document_file_mimeType: file.type || "application/octet-stream",
                            document_file_url: blobClient.url,
                            team_id: form.team_id,
                            status: "ACTIVE",
                            key,
                            size: buffer.length,
                            // No assigned_user for public uploads, or assign to form creator? 
                            // Better to leave null or assign to form creator:
                            assigned_user: form.created_by,
                        }
                    });
                    createdDocumentIds.push(doc.id);
                }
            } catch (uploadError) {
                console.error("Form file upload failed:", uploadError);
                // We accept the submission but log the error? Or fail? 
                // Let's log but proceed with text data to avoid total data loss
            }
        }

        // Extract lead info based on field mappings
        let extracted_email: string | null = null;
        let extracted_phone: string | null = null;
        let extracted_name: string | null = null;
        let extracted_company: string | null = null;
        let extracted_jobTitle: string | null = null;

        for (const field of form.fields) {
            if (field.lead_field_mapping && submittedData[field.name]) {
                const val = submittedData[field.name];
                switch (field.lead_field_mapping) {
                    case "email":
                        extracted_email = val;
                        break;
                    case "phone":
                        extracted_phone = val;
                        break;
                    case "firstName":
                    case "lastName":
                    case "name":
                        extracted_name = extracted_name ? `${extracted_name} ${val}` : val;
                        break;
                    case "company":
                        extracted_company = val;
                        break;
                    case "jobTitle":
                        extracted_jobTitle = val;
                        break;
                }
            }
        }

        // --- CRM Integration: Create Lead ---

        // 1. Name Parsing
        let finalFirstName = "";
        let finalLastName = "Unknown";
        if (extracted_name) {
            const parts = extracted_name.trim().split(/\s+/);
            if (parts.length === 1) {
                finalLastName = parts[0];
            } else {
                finalFirstName = parts.slice(0, -1).join(" ");
                finalLastName = parts[parts.length - 1];
            }
        }

        // Explicit overwrite
        for (const field of form.fields) {
            if (field.lead_field_mapping === "firstName" && submittedData[field.name]) finalFirstName = submittedData[field.name];
            if (field.lead_field_mapping === "lastName" && submittedData[field.name]) finalLastName = submittedData[field.name];
        }

        // 2. Prepare Description
        const directColumnMappings = new Set(["firstName", "lastName", "email", "phone", "company", "jobTitle", "name"]);
        const extraMappedFields: Record<string, string> = {};
        for (const field of form.fields) {
            if (field.lead_field_mapping && !directColumnMappings.has(field.lead_field_mapping) && field.lead_field_mapping !== "__none__" && submittedData[field.name]) {
                extraMappedFields[field.lead_field_mapping] = submittedData[field.name];
            }
        }

        const allMappedKeys = new Set(form.fields.filter((f: any) => f.lead_field_mapping && f.lead_field_mapping !== "__none__").map((f: any) => f.name));
        const unmappedData = Object.entries(submittedData)
            .filter(([key]) => !allMappedKeys.has(key))
            .map(([key, val]) => `${key}: ${val}`)
            .join("\n");

        let leadDescription = `Form Submission: ${form.name}\n`;
        if (Object.keys(extraMappedFields).length > 0) {
            leadDescription += `\n--- Additional Details ---\n`;
            for (const [key, val] of Object.entries(extraMappedFields)) {
                leadDescription += `${key.charAt(0).toUpperCase() + key.slice(1)}: ${val}\n`;
            }
        }
        if (unmappedData) {
            leadDescription += `\n--- Other Data ---\n${unmappedData}`;
        }
        if (createdDocumentIds.length > 0) {
            leadDescription += `\n\n[System] Attached ${createdDocumentIds.length} file(s).`;
        }

        // 3. Create Lead
        let createdLeadId: string | null = null;
        try {
            const lead = await (prismadb as any).crm_Leads.create({
                data: {
                    firstName: finalFirstName,
                    lastName: finalLastName,
                    email: extracted_email,
                    phone: extracted_phone,
                    company: extracted_company,
                    jobTitle: extracted_jobTitle,
                    description: leadDescription,
                    lead_source: `Form: ${form.name}`,
                    status: "NEW",
                    type: "DEMO",
                    team_id: form.team_id,
                    documentsIDs: createdDocumentIds, // Link files
                }
            });
            createdLeadId = lead.id;
        } catch (crmError) {
            console.error("Failed to create CRM Lead:", crmError);
        }

        // Create submission record
        const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
        const ip_hash = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
        const user_agent = req.headers.get("user-agent") || undefined;

        const newSubmission = await (prismadb as any).formSubmission.create({
            data: {
                form_id: form.id,
                data: submittedData, // Stores JSON text version
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
                lead_id: createdLeadId,
            },
        });

        await (prismadb as any).form.update({
            where: { id: form.id },
            data: { submission_count: { increment: 1 } },
        });

        // --- 3. Notifications ---
        const notificationTargets = new Set<string>();

        // Add extra emails from form config
        if (form.notify_emails && Array.isArray(form.notify_emails)) {
            form.notify_emails.forEach((email: string) => notificationTargets.add(email));
        }

        if (notificationTargets.size > 0) {
            try {
                const recipients = Array.from(notificationTargets);

                console.log(`[Form Notification] Lead ${createdLeadId} -> ${recipients.join(", ")}`);

                console.log(`[Form Submission ${newSubmission.id}] Starting PDF generation...`);
                // Generate PDF once for all recipients
                const pdfBuffer = await generateSubmissionPdf({
                    ...newSubmission,
                    form: form
                });
                console.log(`[Form Submission ${newSubmission.id}] PDF generation SUCCESS (${pdfBuffer.length} bytes)`);

                const attachments = [{
                    filename: `submission-${newSubmission.id}.pdf`,
                    content: pdfBuffer,
                    contentType: "application/pdf"
                }];

                // Send individually for better reliability and to avoid bulk-mail filters
                const timestamp = format(new Date(), "HH:mm:ss");
                for (const recipient of recipients) {
                    try {
                        await sendTeamEmail(form.team_id, {
                            to: recipient,
                            // Use team's configured email if available, otherwise system default fallback
                            from: undefined,
                            subject: `🟢 [NEW] ${form.name} | ${extracted_name || "New Applicant"} | ${timestamp}`,
                            text: `You have a new submission from ${form.name}.\n\nView in CRM: ${process.env.NEXT_PUBLIC_APP_URL}/crm/leads/${createdLeadId}`,
                            html: `
                            <div style="font-family: 'Inter', -apple-system, sans-serif; background-color: #f9fafb; padding: 40px 20px;">
                                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                                    <div style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 32px; text-align: center;">
                                        <h2 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 0.05em; text-transform: uppercase;">New Submission</h2>
                                        <p style="color: #9ca3af; margin: 8px 0 0 0; font-size: 14px;">${form.name}</p>
                                    </div>
                                    
                                    <div style="padding: 32px;">
                                        <div style="margin-bottom: 32px;">
                                            <h3 style="color: #111827; font-size: 18px; margin: 0 0 16px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Applicant Details</h3>
                                            <table style="width: 100%; border-collapse: collapse;">
                                                ${extracted_name ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 100px;">Name</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${extracted_name}</td></tr>` : ""}
                                                ${extracted_email ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 100px;">Email</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${extracted_email}</td></tr>` : ""}
                                                ${extracted_company ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 100px;">Company</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${extracted_company}</td></tr>` : ""}
                                                <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 100px;">Time</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${format(new Date(), "PPP pp")}</td></tr>
                                            </table>
                                        </div>

                                        <div style="background-color: #f3f4f6; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
                                            <p style="color: #4b5563; font-size: 14px; margin: 0 0 16px 0;">A full PDF report has been generated and attached to this email.</p>
                                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/crm/leads/${createdLeadId}" 
                                               style="display: inline-block; background-color: #000000; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                                               View in Control Center
                                            </a>
                                        </div>
                                    </div>
                                    
                                    <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Basalt CRM Engine. All rights reserved.</p>
                                    </div>
                                </div>
                            </div>
                            `,
                            attachments
                        });
                        console.log(`[Email Success] ${recipient}`);
                    } catch (emailErr: any) {
                        console.error(`[Email Failure] ${recipient}:`, emailErr.message || emailErr);
                    }
                }
            } catch (notifyErr: any) {
                console.error(`[Form Submission ${newSubmission.id}] Critical Notification Engine failure:`, notifyErr.message || notifyErr);
            }
        }

        if (extracted_email && (form.auto_respond || true)) { // User requested generic auto-reply, force enabled for now or verify form config
            try {
                await sendTeamEmail(form.team_id, {
                    to: extracted_email,
                    from: undefined, // Use team config
                    subject: form.auto_respond_subject || `Received: ${form.name}`,
                    text: form.auto_respond_body || "Thank you for contacting us. We have received your message and will get back to you shortly.",
                });
            } catch (replyErr) {
                console.error("Failed to send auto-reply:", replyErr);
            }
        }

        // --- 5. Webhook Integration ---
        // Fire and forget - don't block the response
        if (form.webhook_url) {
            const webhookPayload = {
                event: "form_submission",
                form_id: form.id,
                form_name: form.name,
                form_slug: form.slug,
                submitted_at: new Date().toISOString(),
                lead_id: createdLeadId,
                lead_email: extracted_email,
                lead_name: `${finalFirstName} ${finalLastName}`.trim(),
                data: submittedData,
                files: uploadedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })),
                source: {
                    url: source_url,
                    referrer: referrer,
                    utm_source: utm_source,
                    utm_medium: utm_medium,
                    utm_campaign: utm_campaign
                }
            };

            fetch(form.webhook_url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(webhookPayload)
            }).catch(err => console.error(`Webhook failed for form ${form.id}:`, err));
        }

        return NextResponse.json({
            success: true,
            message: form.success_message || "Thank you for your submission!",
            submission_behavior: form.submission_behavior,
            redirect_url: form.redirect_url,
        }, { headers: corsHeaders });

    } catch (error) {
        console.error("Error submitting form:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders });
    }
}

// Allow CORS for public form submissions
export async function OPTIONS(req: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: corsHeaders,
    });
}
