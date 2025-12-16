import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getAiSdkModel } from "@/lib/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { sendSmsPinpoint } from "@/lib/aws/pinpoint";
import { ensureContactForLead } from "@/actions/crm/lead-conversions";

/**
 * POST /api/outreach/sms
 * Body: {
 *   leadIds: string[];
 *   promptOverride?: string;
 *   senderId?: string; // optional, region dependent
 *   test?: boolean; // send to TEST_PHONE_NUMBER when true
 * }
 *
 * Behavior:
 * - Loads leads scoped to current user unless admin.
 * - For each lead with a phone number, generates a concise personalized SMS via OpenAI.
 * - Sends via Amazon Pinpoint SMS.
 * - Inserts crm_Lead_Activities entries (type: "sms_sent").
 */

type RequestBody = {
  leadIds: string[];
  promptOverride?: string;
  senderId?: string;
  test?: boolean;
  testPhone?: string; // Override test phone number
  // Pre-generated SMS body to skip AI regeneration
  preGeneratedBody?: string;
};

const DEFAULT_TEST_PHONE = process.env.TEST_PHONE_NUMBER || "+15555550100"; // replace as needed

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
}) {
  const { basePrompt, contact, meetingLink } = params;
  const fallbackBase = `You are contacting a potential investor/customer about PortalPay. Compose a short SMS (160-320 chars) with a crisp value prop (crypto checkout, lower fees, instant settlement), personalize with their name/company if available, and end with a CTA (reply or link).`;
  const promptBase = (basePrompt && basePrompt.trim().length ? basePrompt : fallbackBase).trim();

  const contactBlock = `\nContact:\n- Name: ${contact?.name || ""}\n- Company: ${contact?.company || ""}\n- Title: ${contact?.jobTitle || ""}\n- Email: ${contact?.email || ""}\n- Phone: ${contact?.phone || ""}`;
  const meetingBlock = `\nMeeting/CTA link (optional): ${meetingLink || "N/A"}`;
  return [promptBase, contactBlock, meetingBlock].join("\n\n");
}

function sanitizeSmsBody(body: string): string {
  const plain = body.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  if (plain.length <= 320) return plain;
  return plain.slice(0, 317) + "...";
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const body = (await req.json()) as RequestBody;
    if (!Array.isArray(body.leadIds) || body.leadIds.length === 0) {
      return new NextResponse("No leads provided", { status: 400 });
    }

    const user = await prismadb.users.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        is_admin: true,
        is_account_admin: true,
        meeting_link: true,
        outreach_prompt_default: true,
      } as const,
    });
    if (!user) return new NextResponse("User not found", { status: 404 });
    const isAdmin = !!(user.is_admin || user.is_account_admin);

    const leads = await prismadb.crm_Leads.findMany({
      where: { id: { in: body.leadIds }, ...(isAdmin ? {} : { assigned_to: session.user.id }) },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        jobTitle: true,
        email: true,
        phone: true,
        outreach_meeting_link: true,
      },
    });
    if (!leads || leads.length === 0) {
      return NextResponse.json({ sent: 0, results: [], message: "No leads to process" });
    }

    const model = await getAiSdkModel(session.user.id);
    if (!model) return new NextResponse("AI model not configured", { status: 500 });

    const senderId = body.senderId?.trim() || undefined;
    const testMode = !!body.test;
    const testPhoneOverride = body.testPhone?.trim();
    const preGeneratedBody = body.preGeneratedBody?.trim();

    const results: Array<{ leadId: string; status: "skipped" | "sent" | "error"; reason?: string; to?: string; body?: string; messageId?: string; }> = [];

    for (const lead of leads) {
      const toNumber = testMode
        ? (testPhoneOverride || DEFAULT_TEST_PHONE)
        : (lead.phone || "").trim();
      if (!toNumber) { results.push({ leadId: lead.id, status: "skipped", reason: "No lead phone" }); continue; }

      // TODO: honor sms opt-out when schema field is added

      // Build SMS content via LLM
      const basePrompt = body.promptOverride?.trim() || user.outreach_prompt_default || null;
      const contactName = [lead.firstName, lead.lastName].filter(Boolean).join(" ").trim();
      const userPrompt = buildSmsPrompt({
        basePrompt,
        contact: { name: contactName || undefined, company: lead.company || undefined, jobTitle: lead.jobTitle || undefined, email: lead.email || undefined, phone: lead.phone || undefined },
        meetingLink: lead.outreach_meeting_link || user.meeting_link || null,
      });

      // Use pre-generated body if provided (skip AI call)
      let smsBody = preGeneratedBody || "Hi there — quick intro to PortalPay: crypto checkout, instant settlement, lower fees. Can I send a link for details?";

      // Only call AI if no pre-generated body provided
      if (!preGeneratedBody) {
        try {
          const { object } = await generateObject({
            model,
            schema: z.object({
              body: z.string(),
            }),
            messages: [
              { role: "system", content: systemInstructionSms() },
              { role: "user", content: userPrompt },
            ],
          });
          smsBody = sanitizeSmsBody(object.body || smsBody);
        } catch (err: any) {
          // keep default
          console.error("[SMS][AI_ERROR]", err?.message || err);
        }
      }

      // Compliance footer (basic)
      const footer = " Reply STOP to opt out.";
      let finalBody = smsBody;
      if (finalBody.length + footer.length <= 320) finalBody += footer;

      try {
        const sendRes = await sendSmsPinpoint({ to: toNumber, body: finalBody, senderId });
        const msgId = sendRes.results[toNumber]?.messageId;

        // Persist activity
        await prismadb.crm_Lead_Activities.create({
          data: {
            lead: lead.id,
            user: session.user.id,
            type: "sms_sent",
            metadata: {
              to: toNumber,
              body: finalBody,
              messageId: msgId,
              usedPrompt: (body.promptOverride && "batchOverride") || (user.outreach_prompt_default ? "userDefault" : "fallback"),
              pipeline_stage: "Engage_AI",
            } as any,
          },
        });
        await ensureContactForLead(lead.id).catch(() => { });

        results.push({ leadId: lead.id, status: "sent", to: toNumber, body: finalBody, messageId: msgId });
      } catch (err: any) {
        console.error("[SMS][PINPOINT_SEND_ERROR]", err?.message || err);
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
    console.error("[OUTREACH_SMS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
