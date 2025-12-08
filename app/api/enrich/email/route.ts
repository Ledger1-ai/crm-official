import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import resendHelper from "@/lib/resend";
import { prismadbCrm } from "@/lib/prisma-crm";
import { isValidEmailFormat, normalizeEmail } from "@/lib/scraper/quality/email-filters";

// Premium-gated manual enrich endpoint
// Sends a minimal email via Resend to trigger delivered/bounce events
// Webhook at /api/resend/webhook will set emailStatus accordingly

function premiumEnabled(): boolean {
  // Simple flag gate; optionally extend to check team plan
  return (process.env.SCRAPER_ENRICH_PREMIUM || "true").toLowerCase() !== "false";
}

export async function POST(req: NextRequest) {
  try {
    if (!premiumEnabled()) {
      return NextResponse.json({ ok: false, error: "Premium enrich is disabled" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const rawEmail = body?.email as string | undefined;
    const contactCandidateId = body?.contactCandidateId as string | undefined;
    const fromAddress = (process.env.RESEND_FROM || body?.from || "no-reply@localhost.localdomain") as string;

    const email = normalizeEmail(rawEmail || "");
    if (!email || !isValidEmailFormat(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }

    const resend = await resendHelper();
    if (!resend) {
      return NextResponse.json({ ok: false, error: "Resend API key not configured" }, { status: 500 });
    }

    // Send lightweight message
    const subject = body?.subject || "Address availability check";
    const text = body?.text || "This is a one-time address availability check initiated by the account owner.";

    const sendResult = await resend.emails.send({
      from: fromAddress,
      to: email,
      subject,
      text,
    } as any);

    // Mark enrichment requested so UI can show pending state
    try {
      if (contactCandidateId) {
        await prismadbCrm.crm_Contact_Candidates.update({
          where: { id: contactCandidateId },
          data: {
            provenance: {
              source: "resend_enrich_request",
              requestedAt: new Date().toISOString(),
              sendResultId: (sendResult as any)?.id || (sendResult as any)?.data?.id,
            } as any,
            status: "NEW",
          },
        });
      } else {
        await prismadbCrm.crm_Contact_Candidates.updateMany({
          where: { email },
          data: {
            provenance: {
              source: "resend_enrich_request",
              requestedAt: new Date().toISOString(),
              sendResultId: (sendResult as any)?.id || (sendResult as any)?.data?.id,
            } as any,
            status: "NEW",
          },
        });
      }
    } catch {}

    return NextResponse.json({ ok: true, email, sendId: (sendResult as any)?.id || (sendResult as any)?.data?.id }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
