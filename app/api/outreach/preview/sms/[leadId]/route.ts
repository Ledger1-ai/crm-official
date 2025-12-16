import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getAiSdkModel } from "@/lib/openai";
import { generateObject } from "ai";
import { z } from "zod";

/**
 * POST /api/outreach/preview/sms/[leadId]
 * Body: {
 *   promptOverride?: string;
 *   includeResearch?: boolean;
 *   meetingLinkOverride?: string;
 *   senderId?: string; // not used in preview, only for send
 * }
 *
 * Returns a preview payload without sending:
 * {
 *   body: string
 * }
 *
 * Notes:
 * - References specific lead information and the project assigned to the lead, and injects a meeting link when available.
 * - Optionally includes lightweight company research derived from the lead's email domain to improve personalization.
 * - Mirrors the generation style in /api/outreach/sms but returns preview only.
 */

type RequestBody = {
    promptOverride?: string;
    includeResearch?: boolean;
    meetingLinkOverride?: string;
    senderId?: string;
};

function systemInstructionSms() {
    return [
        "You are a top SDR writing a concise, high-conversion SMS for first contact.",
        "Return ONLY JSON with keys 'body'.",
        "Constraints:",
        "- 160 to 320 characters.",
        "- Plain text only.",
        "- Clear value prop and CTA (reply or link).",
        "- Respect professional tone; no spammy language.",
    ].join(" ");
}

function buildSmsPrompt(params: {
    basePrompt: string | null | undefined;
    contact: { name?: string | null; company?: string | null; jobTitle?: string | null; email?: string | null; phone?: string | null };
    meetingLink?: string | null;
    research?: string | null;
}) {
    const { basePrompt, contact, meetingLink, research } = params;
    const fallbackBase = `You are contacting a potential investor/customer about PortalPay. Compose a short SMS (160-320 chars) with a crisp value prop (crypto checkout, lower fees, instant settlement), personalize with their name/company if available, and end with a CTA (reply or link).`;
    const promptBase = (basePrompt && basePrompt.trim().length ? basePrompt : fallbackBase).trim();

    const contactBlock = `\nContact:\n- Name: ${contact?.name || ""}\n- Company: ${contact?.company || ""}\n- Title: ${contact?.jobTitle || ""}\n- Email: ${contact?.email || ""}\n- Phone: ${contact?.phone || ""}`;
    const meetingBlock = `\nMeeting/CTA link (optional): ${meetingLink || "N/A"}`;
    const researchBlock = `\nCompany Research (optional): ${research && research.trim().length ? research : "N/A"}`;
    return [promptBase, contactBlock, researchBlock, meetingBlock].join("\n\n");
}

function sanitizeSmsBody(body: string): string {
    const plain = body.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    if (plain.length <= 320) return plain;
    return plain.slice(0, 317) + "...";
}

// Lightweight website research using email domain (same approach as email preview)
async function basicCompanyResearchFromEmail(email?: string | null): Promise<string | null> {
    try {
        if (!email || !email.includes("@")) return null;
        const domain = email.split("@")[1];
        if (!domain) return null;

        const candidates = [`https://${domain}`, `http://${domain}`, `https://www.${domain}`, `http://www.${domain}`];
        for (const url of candidates) {
            try {
                const res = await fetch(url, { method: "GET", headers: { "User-Agent": "Mozilla/5.0" } });
                if (!res.ok) continue;
                const html = await res.text();

                const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
                const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);

                const snippets: string[] = [];
                if (metaDescMatch?.[1]) snippets.push(metaDescMatch[1]);
                if (ogDescMatch?.[1]) snippets.push(ogDescMatch[1]);

                if (snippets.length === 0) {
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
                // continue
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

        // Fetch user defaults
        const user = await prismadb.users.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                meeting_link: true,
                outreach_prompt_default: true,
            } as const,
        });
        if (!user) return new NextResponse("User not found", { status: 404 });

        // Fetch lead with assigned project info (referenced in prompt via meeting link and context)
        const lead = await prismadb.crm_Leads.findFirst({
            where: { id: leadId },
            include: { assigned_project: true },
        });
        if (!lead) return new NextResponse("Lead not found", { status: 404 });

        const meetingLink = meetingLinkOverride || lead.outreach_meeting_link || user.meeting_link || null;

        // Optional research
        let researchSummary: string | null = null;
        if (includeResearch) {
            researchSummary = await basicCompanyResearchFromEmail(lead.email);
        }

        const contactName = [lead.firstName, lead.lastName].filter(Boolean).join(" ").trim();
        const basePrompt = body.promptOverride?.trim() || user.outreach_prompt_default || null;

        const userPrompt = buildSmsPrompt({
            basePrompt,
            contact: {
                name: contactName || undefined,
                company: lead.company || undefined,
                jobTitle: lead.jobTitle || undefined,
                email: lead.email || undefined,
                phone: lead.phone || undefined,
            },
            meetingLink,
            research: researchSummary,
        });

        // Append assigned project briefing if present to strengthen personalization
        const project = (lead as any)?.assigned_project || null;
        const projectBlock = project
            ? `
Project Briefing:
- Title: ${String(project?.title || "")}
- Summary: ${String(project?.description || "")}
`.trim()
            : "";
        const userPromptWithProject = [userPrompt, projectBlock].filter(Boolean).join("\n\n");

        const model = await getAiSdkModel(session.user.id);
        if (!model) return new NextResponse("AI model not configured", { status: 500 });

        let smsBody = "Hi there — quick intro to PortalPay: crypto checkout, instant settlement, lower fees. Can I send a link for details?";
        try {
            const { object } = await generateObject({
                model,
                schema: z.object({
                    body: z.string(),
                }),
                messages: [
                    { role: "system", content: systemInstructionSms() },
                    { role: "user", content: userPromptWithProject || userPrompt },
                ],
            });
            smsBody = sanitizeSmsBody(object.body || smsBody);
        } catch (err: any) {
            // eslint-disable-next-line no-console
            console.error("[OUTREACH_PREVIEW_SMS][AI_ERROR]", err?.message || err);
        }

        return NextResponse.json({ body: smsBody }, { status: 200 });
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[OUTREACH_PREVIEW_SMS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
