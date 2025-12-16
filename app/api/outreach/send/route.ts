import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import sendEmail from "@/lib/sendmail";
import { sendEmailSES } from "@/lib/aws/ses";
import { render } from "@react-email/render";
import OutreachTemplate, { type ResourceLink } from "@/emails/OutreachTemplate";
import { getAiSdkModel } from "@/lib/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { sendViaGmail } from "@/lib/gmail";
import React from "react";
import { ensureContactForLead } from "@/actions/crm/lead-conversions";

/**
 * POST /api/outreach/send
 * Body: {
 *   leadIds: string[];
 *   test?: boolean;
 *   promptOverride?: string;
 *   meetingLinkOverride?: string;
 * }
 *
 * Behavior:
 * - Loads leads (scoped to current user unless admin).
 * - For each lead, generates a personalized email (subject/body in plain text) using OpenAI (Azure/OpenAI).
 * - Renders OutreachTemplate (HTML) including resources, signature, and a tracking pixel.
 * - Sends via nodemailer (SMTP) using lib/sendmail.ts.
 * - Updates lead outreach fields and inserts crm_Lead_Activities.
 */

type RequestBody = {
  leadIds: string[];
  test?: boolean;
  testEmail?: string;
  promptOverride?: string;
  meetingLinkOverride?: string;
  // Pre-generated content to skip AI regeneration (for test sends using preview)
  preGeneratedSubject?: string;
  preGeneratedBody?: string;
  preGeneratedHtml?: string;
};

const DEFAULT_TEST_EMAIL = "founders@theutilitycompany.co";

// Default PortalPay resource configuration if user has none
const DEFAULT_RESOURCES: ResourceLink[] = [
  {
    id: "portalpay",
    label: "Explore PortalPay",
    href: "https://pay.ledger1.ai",
    type: "primary",
    enabled: true,
  },
  {
    id: "calendar",
    label: "Schedule a Call",
    href: "https://calendar.app.google/EJ4WsqeS2JSXt6ZcA",
    type: "primary",
    enabled: true,
  },
  {
    id: "investor_portal",
    label: "View Investor Portal",
    href: "https://stack.angellist.com/s/lp1srl5cnf",
    type: "secondary",
    enabled: true,
  },
  {
    id: "data_room",
    label: "Access Data Room",
    href: "https://stack.angellist.com/s/x8g9yjgpbw",
    type: "secondary",
    enabled: true,
  },
];

// Lightweight HTML stripper for plaintext fallback
function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "");
}

// Compose the strict system instruction to force JSON output
function systemInstruction() {
  return [
    "You are a professional BD specialist writing personalized VC outreach emails.",
    "Return ONLY JSON with keys 'subject' and 'body'.",
    "The 'body' must be plain text (no HTML), 250–300 words, in first person.",
    "Do not include headings or phrases like 'Founder note'.",
  ].join(" ");
}

// Build the per-lead prompt from a per-user default (if present) or fallback
function buildUserPrompt(params: {
  basePrompt: string | null | undefined;
  contact: {
    name?: string | null;
    company?: string | null;
    jobTitle?: string | null;
    email?: string | null;
  };
  companyResearch?: string | null;
  meetingLink?: string | null;
}) {
  const { basePrompt, contact, companyResearch, meetingLink } = params;

  // Base prompt fallback (shortened/curated from provided Python script)
  const fallbackBase = `
You are writing a personalized VC outreach email about PortalPay. Use any available company research to tailor the message.

PortalPay Briefing:
- Crypto-native payment gateway enabling physical merchants to accept stablecoins and crypto tokens at checkout (QR scan) with on-chain settlement.
- Innovations:
  • Multi-Token: USDC, USDT, cbBTC, cbXRP, ETH on Base
  • Cost: 2–3% savings vs card rails
  • Instant Settlement
  • White-Label Platform
  • Smart Treasury (token mix/rotation)
  • Programmable Revenue (on-chain splits)
  • Real-Time Intelligence (USD volume/analytics)
  • Global by Default (borderless stablecoin settlement)
- Opportunity: Horizontal platform play; $100B+ POS market.
- Tech stack: Thirdweb SDK, Base network, Next.js, Azure Cosmos DB.
- Traction: Live merchants, white-label ready, multi-chain roadmap.
- Founder/meetings: Available for remote investor meetings; prefer in-person in Albuquerque/Santa Fe only.

Requirements:
- Output JSON ONLY with keys "subject" and "body".
- "body" MUST be plain text (no HTML), 250–300 words.
- Style: sophisticated, narrative, insight-driven; open with a hook referencing their thesis/portfolio if possible (use company research if present).
- Personalization: use research when available; connect PortalPay to their focus.
- Use first-person voice ("I"), no third person references to the founder.
- Avoid headings like "Founder note:" or similar.
- End with a confident CTA referencing remote availability.
`.trim();

  const promptBase = (basePrompt && basePrompt.trim().length > 0 ? basePrompt : fallbackBase).trim();

  const contactBlock = `
Contact:
- Name: ${contact?.name || ""}
- Company/Firm: ${contact?.company || ""}
- Title: ${contact?.jobTitle || ""}
- Email: ${contact?.email || ""}
`.trim();

  const companyBlock = `
Company Research (optional):
${companyResearch && companyResearch.trim().length > 0 ? companyResearch : "N/A"}
`.trim();

  const meetingBlock = `
Meeting preference/link (for CTA): ${meetingLink || "N/A"}
`.trim();

  // The final USER message content
  return [promptBase, contactBlock, companyBlock, meetingBlock].join("\n\n");
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = (await req.json()) as RequestBody;
    if (!Array.isArray(body.leadIds) || body.leadIds.length === 0) {
      return new NextResponse("No leads provided", { status: 400 });
    }

    // Check current user (for admin privileges)
    const user = await prismadb.users.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        is_admin: true,
        is_account_admin: true,
        meeting_link: true,
        signature_html: true,
        resource_links: true,
        outreach_prompt_default: true,
      } as const,
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const isAdmin = !!(user.is_admin || user.is_account_admin);

    // Fetch leads, scoped by user if not admin
    const leads = await prismadb.crm_Leads.findMany({
      where: {
        id: { in: body.leadIds },
        ...(isAdmin ? {} : { assigned_to: session.user.id }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        jobTitle: true,
        email: true,
        assigned_to: true,
        outreach_meeting_link: true,
        outreach_status: true,
      },
    });

    if (!leads || leads.length === 0) {
      return NextResponse.json({ sent: 0, results: [], message: "No leads to process" });
    }

    // A subtle compliance: skip contacts with unsubscribed email if we can match them
    // (Best effort, optional)
    const leadEmails = leads.map((l: any) => l.email).filter(Boolean) as string[];
    const unsubscribedContacts = await prismadb.crm_Contacts.findMany({
      where: { email: { in: leadEmails } },
      select: { email: true, email_unsubscribed: true },
    });
    const unsubSet = new Set(
      unsubscribedContacts.filter((c: any) => c.email_unsubscribed).map((c: any) => (c.email || "").toLowerCase()),
    );

    // Prepare OpenAI client
    const model = await getAiSdkModel(session.user.id);
    if (!model) {
      return new NextResponse("AI model not configured", { status: 500 });
    }

    // Base URL for links/pixel
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";

    // User resources/signature
    let resources: ResourceLink[] = DEFAULT_RESOURCES;
    try {
      if (user.resource_links && typeof user.resource_links === "object") {
        // resource_links is JSON in DB; Prisma type is unknown (Json)
        resources = (user.resource_links as any) as ResourceLink[];
        if (!Array.isArray(resources)) resources = DEFAULT_RESOURCES;
      }
    } catch {
      resources = DEFAULT_RESOURCES;
    }
    const signatureHtml = user.signature_html || undefined;

    const testMode = !!body.test;
    const testEmailOverride = body.testEmail?.trim();
    const meetingLinkOverride = body.meetingLinkOverride?.trim();
    const promptOverride = body.promptOverride?.trim();

    // Pre-generated content (skip AI if provided)
    const preGeneratedSubject = body.preGeneratedSubject?.trim();
    const preGeneratedBody = body.preGeneratedBody?.trim();
    const preGeneratedHtml = body.preGeneratedHtml;

    const results: Array<{
      leadId: string;
      status: "skipped" | "sent" | "error";
      reason?: string;
      subject?: string;
      to?: string;
      messageId?: string;
    }> = [];

    for (const lead of leads) {
      // Basic validation
      const toEmail = testMode
        ? (testEmailOverride || process.env.TEST_EMAIL || DEFAULT_TEST_EMAIL)
        : (lead.email || "");
      if (!toEmail) {
        results.push({ leadId: lead.id, status: "skipped", reason: "No lead email" });
        continue;
      }
      if (unsubSet.has(toEmail.toLowerCase())) {
        results.push({ leadId: lead.id, status: "skipped", reason: "Unsubscribed contact" });
        continue;
      }

      // Choose meeting link: override > lead's outreach_meeting_link > user's profile meeting link
      const meetingLink = meetingLinkOverride || lead.outreach_meeting_link || user.meeting_link || null;

      // Create or reuse tracking token (generate new on send)
      const token = (globalThis.crypto?.randomUUID && globalThis.crypto.randomUUID()) || `${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}`;
      const trackingPixelUrl = baseUrl ? `${baseUrl}/api/outreach/open/${encodeURIComponent(token)}.png` : undefined;

      // Build LLM prompt
      const contactName = [lead.firstName, lead.lastName].filter(Boolean).join(" ").trim();
      const basePrompt = promptOverride || user.outreach_prompt_default || null;

      const userPrompt = buildUserPrompt({
        basePrompt,
        contact: {
          name: contactName || undefined,
          company: lead.company || undefined,
          jobTitle: lead.jobTitle || undefined,
          email: lead.email || undefined,
        },
        // For now, no enrichment; a later pass can add real company research
        companyResearch: null,
        meetingLink,
      });

      // Use pre-generated content if provided (skips AI call - faster for test sends)
      let subject = preGeneratedSubject || "Exploring Partnership Opportunities";
      let bodyText = preGeneratedBody || "Hello,\n\nI'd like to explore how PortalPay could align with your investment thesis.\n\nThanks.";

      // Only call AI if no pre-generated content provided
      if (!preGeneratedSubject || !preGeneratedBody) {
        try {
          const { object } = await generateObject({
            model,
            schema: z.object({
              subject: z.string(),
              body: z.string(),
            }),
            messages: [
              { role: "system", content: systemInstruction() },
              { role: "user", content: userPrompt },
            ],
          });

          subject = object.subject || subject;
          bodyText = object.body || bodyText;

        } catch (err: any) {
          // Keep defaults on failure
          // eslint-disable-next-line no-console
          console.error("[OUTREACH_SEND][AI_ERROR]", err?.message || err);
        }
      }

      // Use pre-generated HTML or render new
      let html: string;
      if (preGeneratedHtml) {
        html = preGeneratedHtml;
      } else {
        html = await render(
          React.createElement(OutreachTemplate, {
            subjectPreview: subject,
            bodyText,
            resources,
            signatureHtml,
            trackingPixelUrl,
            brand: {
              accentColor: "#F54029",
              primaryText: "#1f2937",
            },
          }),
        );
      }

      // Prepare plaintext fallback (use the LLM plain text body)
      const text = stripHtml(bodyText);

      // Send email via Amazon SES (primary), fallback to Gmail or SMTP
      try {
        const fromAddress =
          process.env.SES_FROM_ADDRESS ||
          process.env.EMAIL_FROM ||
          process.env.EMAIL_USERNAME ||
          `no-reply@${new URL(baseUrl || "http://localhost").hostname}`;

        let transport: "ses" | "gmail" | "smtp" = "ses";
        let messageId: string | null = null;

        // Attempt SES first
        try {
          const sesRes = await sendEmailSES({ to: toEmail, from: fromAddress, subject, html, text });
          messageId = sesRes.messageId || null;
          transport = messageId ? "ses" : transport;
        } catch (e) {
          // Fallback to Gmail
          try {
            messageId = await sendViaGmail(session.user.id, toEmail, subject, html, text);
            if (messageId) transport = "gmail";
          } catch {
            // Fallback to SMTP
            await sendEmail({ from: fromAddress, to: toEmail, subject, text, html });
            transport = "smtp";
          }
        }

        // Persist outreach fields
        const updateData: any = {
          outreach_status: "SENT" as any,
          outreach_sent_at: new Date() as any,
          outreach_first_message_id: messageId || undefined,
          outreach_open_token: token,
          pipeline_stage: "Engage_AI" as any,
          outreach_transport: transport as any,
        };

        if (meetingLink && (!lead.outreach_meeting_link || meetingLinkOverride)) {
          updateData.outreach_meeting_link = meetingLink;
        }

        await prismadb.crm_Leads.update({
          where: { id: lead.id },
          data: updateData,
        });
        await ensureContactForLead(lead.id).catch(() => { });

        // Insert activity
        await prismadb.crm_Lead_Activities.create({
          data: {
            lead: lead.id,
            user: session.user.id,
            type: "email_sent",
            metadata: {
              to: toEmail,
              subject,
              bodyText,
              meetingLink,
              messageId,
              usedPrompt: (promptOverride && "batchOverride") || (user.outreach_prompt_default ? "userDefault" : "fallback"),
              pipeline_stage: "Engage_AI",
            } as any,
          },
        });

        results.push({ leadId: lead.id, status: "sent", subject, to: toEmail });
      } catch (err: any) {
        // eslint-disable-next-line no-console
        console.error("[OUTREACH_SEND][SMTP_ERROR]", err?.message || err);
        results.push({ leadId: lead.id, status: "error", reason: err?.message || "Send failed" });
      }
    }

    const summary = {
      requested: body.leadIds.length,
      processed: leads.length,
      sent: results.filter((r) => r.status === "sent").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      errors: results.filter((r) => r.status === "error").length,
      results,
    };
    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[OUTREACH_SEND_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
