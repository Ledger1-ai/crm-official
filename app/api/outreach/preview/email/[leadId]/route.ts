import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getAiSdkModel } from "@/lib/openai";
import { generateObject } from "ai";
import { z } from "zod";
import OutreachTemplate, { type ResourceLink } from "@/emails/OutreachTemplate";
import { render } from "@react-email/render";
import React from "react";

/**
 * POST /api/outreach/preview/email/[leadId]
 * Body: {
 *   promptOverride?: string;
 *   includeResearch?: boolean;
 *   meetingLinkOverride?: string;
 * }
 *
 * Returns a preview payload without sending:
 * {
 *   subject: string,
 *   bodyText: string,
 *   html: string,
 *   project?: { title?: string, description?: string },
 *   researchSummary?: string
 * }
 *
 * Notes:
 * - References the project assigned to the lead (Boards relation) and the specific lead information.
 * - Performs lightweight company research based on the email domain when includeResearch is true.
 * - Uses the same structured prompt style as /api/outreach/send but returns preview only.
 */

type RequestBody = {
    promptOverride?: string;
    includeResearch?: boolean;
    meetingLinkOverride?: string;
    resourceLinksOverride?: ResourceLink[];
    signatureHtmlOverride?: string;
};

const DEFAULT_RESOURCES: ResourceLink[] = [
    { id: "portalpay", label: "Explore PortalPay", href: "https://pay.ledger1.ai", type: "primary", enabled: true },
    { id: "calendar", label: "Schedule a Call", href: "https://calendar.app.google/EJ4WsqeS2JSXt6ZcA", type: "primary", enabled: true },
    { id: "investor_portal", label: "View Investor Portal", href: "https://stack.angellist.com/s/lp1srl5cnf", type: "secondary", enabled: true },
    { id: "data_room", label: "Access Data Room", href: "https://stack.angellist.com/s/x8g9yjgpbw", type: "secondary", enabled: true },
];

// Compose the strict system instruction to force JSON output
function systemInstruction() {
    return [
        "You are a professional BD specialist writing personalized VC outreach emails.",
        "Return ONLY JSON with keys 'subject' and 'body'.",
        "The 'body' must be plain text (no HTML), 250–300 words, in first person.",
        "Do not include headings or phrases like 'Founder note'.",
    ].join(" ");
}

// Build the per-lead prompt from a per-user default (if present) or fallback, with optional company research
function buildUserPrompt(params: {
    basePrompt: string | null | undefined;
    contact: { name?: string | null; company?: string | null; jobTitle?: string | null; email?: string | null };
    companyResearch?: string | null;
    meetingLink?: string | null;
}) {
    const { basePrompt, contact, companyResearch, meetingLink } = params;

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

    return [promptBase, contactBlock, companyBlock, meetingBlock].join("\n\n");
}

// Lightweight website research using email domain
async function basicCompanyResearchFromEmail(email?: string | null): Promise<string | null> {
    try {
        if (!email || !email.includes("@")) return null;
        const domain = email.split("@")[1];
        if (!domain) return null;

        // Try https first, then http
        const candidates = [`https://${domain}`, `http://${domain}`, `https://www.${domain}`, `http://www.${domain}`];
        for (const url of candidates) {
            try {
                const res = await fetch(url, { method: "GET", headers: { "User-Agent": "Mozilla/5.0" } });
                if (!res.ok) continue;
                const html = await res.text();

                // meta name="description"
                const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
                const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);

                const snippets: string[] = [];
                if (metaDescMatch?.[1]) snippets.push(metaDescMatch[1]);
                if (ogDescMatch?.[1]) snippets.push(ogDescMatch[1]);

                // Fallback: extract first few visible paragraph texts crudely
                if (snippets.length === 0) {
                    // Avoid using the 's' (dotAll) flag for broader TS compatibility; use [\s\S] instead.
                    const paragraphMatches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
                    const paragraphs = paragraphMatches
                        .map((inner) => inner.replace(/<[^>]+>/g, "").trim())
                        .filter((t) => t && t.length > 80 && !/cookie|privacy|copyright/i.test(t))
                        .slice(0, 2);
                    snippets.push(...paragraphs);
                }

                if (snippets.length > 0) {
                    const combined = snippets.slice(0, 2).join(" ");
                    return combined.length > 500 ? combined.slice(0, 497) + "..." : combined;
                }
            } catch {
                // continue to next candidate
            }
        }

        return null;
    } catch {
        return null;
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ leadId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

        const { leadId } = await params;
        if (!leadId) return new NextResponse("Missing leadId", { status: 400 });

        const body = (await req.json().catch(() => ({}))) as RequestBody;
        const includeResearch = !!body.includeResearch;
        const meetingLinkOverride = body.meetingLinkOverride?.trim();

        // Fetch user for signature/resources defaults
        const user = await prismadb.users.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                meeting_link: true,
                signature_html: true,
                resource_links: true,
                outreach_prompt_default: true,
            } as const,
        });
        if (!user) return new NextResponse("User not found", { status: 404 });

        // Fetch lead with assigned project info
        const lead = await prismadb.crm_Leads.findFirst({
            where: { id: leadId },
            include: { assigned_project: true },
        });
        if (!lead) return new NextResponse("Lead not found", { status: 404 });

        const project = (lead as any)?.assigned_project || null;
        const projectInfo = {
            title: String(project?.title || ""),
            description: String(project?.description || ""),
        };

        // Resolve meeting link for preview
        const meetingLink = meetingLinkOverride || lead.outreach_meeting_link || user.meeting_link || null;

        // Build prompt with optional research
        let researchSummary: string | null = null;
        if (includeResearch) {
            researchSummary = await basicCompanyResearchFromEmail(lead.email);
        }

        const contactName = [lead.firstName, lead.lastName].filter(Boolean).join(" ").trim();
        const basePrompt = body.promptOverride?.trim() || user.outreach_prompt_default || null;
        const userPrompt = buildUserPrompt({
            basePrompt,
            contact: {
                name: contactName || undefined,
                company: lead.company || undefined,
                jobTitle: lead.jobTitle || undefined,
                email: lead.email || undefined,
            },
            companyResearch: researchSummary,
            meetingLink,
        });

        // Append assigned project briefing if present to strengthen personalization
        const leadProject = (lead as any)?.assigned_project || null;
        const projectBlock = leadProject
            ? `
Project Briefing:
- Title: ${String(leadProject?.title || "")}
- Summary: ${String(leadProject?.description || "")}
`.trim()
            : "";
        const userPromptWithProject = [userPrompt, projectBlock].filter(Boolean).join("\\n\\n");

        // OpenAI client
        const model = await getAiSdkModel(session.user.id);
        if (!model) return new NextResponse("AI model not configured", { status: 500 });

        let subject = "Exploring Partnership Opportunities";
        let bodyText = "Hello,\n\nI'd like to explore how PortalPay could align with your investment thesis.\n\nThanks.";
        try {
            const { object } = await generateObject({
                model,
                schema: z.object({
                    subject: z.string(),
                    body: z.string(),
                }),
                messages: [
                    { role: "system", content: systemInstruction() },
                    { role: "user", content: userPromptWithProject || userPrompt },
                ],
            });
            subject = object.subject || subject;
            bodyText = object.body || bodyText;
        } catch (err: any) {
            // leave defaults on error
            // eslint-disable-next-line no-console
            console.error("[OUTREACH_PREVIEW_EMAIL][AI_ERROR]", err?.message || err);
        }

        // Prepare resources/signature
        let resources: ResourceLink[] = DEFAULT_RESOURCES;
        try {
            if (user.resource_links && typeof user.resource_links === "object") {
                resources = (user.resource_links as any) as ResourceLink[];
                if (!Array.isArray(resources)) resources = DEFAULT_RESOURCES;
            }
        } catch {
            resources = DEFAULT_RESOURCES;
        }
        // Apply overrides if provided
        if (Array.isArray(body.resourceLinksOverride)) {
            resources = body.resourceLinksOverride;
        }
        const signatureHtml =
            typeof body.signatureHtmlOverride === "string" ? body.signatureHtmlOverride : (user.signature_html || undefined);

        // Render HTML using OutreachTemplate
        const html = await render(
            React.createElement(OutreachTemplate, {
                subjectPreview: subject,
                bodyText,
                resources,
                signatureHtml,
                brand: {
                    accentColor: "#F54029",
                    primaryText: "#1f2937",
                },
            }),
        );

        return NextResponse.json(
            {
                subject,
                bodyText,
                html,
                project: projectInfo,
                researchSummary: researchSummary || "",
            },
            { status: 200 },
        );
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[OUTREACH_PREVIEW_EMAIL_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
