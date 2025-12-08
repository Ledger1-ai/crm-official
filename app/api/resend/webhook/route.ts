import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prismadbCrm } from "@/lib/prisma-crm";

// Resend webhook handler (premium enrich)
// Updates emailStatus for contacts/persons based on delivered/bounce events
// Note: Consider verifying webhook signatures in production (resend-signature header)

function normalizeRecipient(payload: any): string | null {
  // Try common locations
  const candidates: any[] = [];
  if (payload?.data?.to) candidates.push(payload.data.to);
  if (payload?.to) candidates.push(payload.to);
  if (Array.isArray(payload?.data?.rcpt_to)) candidates.push(payload.data.rcpt_to);
  // Normalize to first string email
  for (const c of candidates) {
    if (!c) continue;
    if (Array.isArray(c)) {
      const e = c.find((x) => typeof x === "string" && x.includes("@"));
      if (e) return e.toLowerCase();
    } else if (typeof c === "string" && c.includes("@")) {
      return c.toLowerCase();
    }
  }
  // Some events may embed recipient under payload.email.to
  const e2 = payload?.email?.to;
  if (typeof e2 === "string" && e2.includes("@")) return e2.toLowerCase();
  if (Array.isArray(e2)) {
    const e = e2.find((x: any) => typeof x === "string" && x.includes("@"));
    if (e) return e.toLowerCase();
  }
  return null;
}

function getEventType(payload: any): string {
  return payload?.type || payload?.event || payload?.data?.event || "";
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const eventType = getEventType(payload).toLowerCase();
    const recipient = normalizeRecipient(payload);

    if (!recipient) {
      return NextResponse.json({ ok: false, reason: "no recipient in payload" }, { status: 200 });
    }

    let status: "VALID" | "INVALID" | "UNKNOWN" = "UNKNOWN";
    // Map common Resend events
    if (eventType.includes("delivered")) status = "VALID";
    else if (eventType.includes("bounce") || eventType.includes("bounced")) status = "INVALID";

    // Update crm_Contact_Candidates by email
    if (status !== "UNKNOWN") {
      await prismadbCrm.crm_Contact_Candidates.updateMany({
        where: { email: recipient },
        data: {
          emailStatus: status,
          confidence: status === "VALID" ? 85 : status === "INVALID" ? 50 : undefined,
          provenance: {
            source: "resend_webhook",
            eventType,
            receivedAt: new Date().toISOString(),
          } as any,
        },
      });

      // Also update global persons if present
      await prismadbCrm.crm_Global_Persons.updateMany({
        where: { email: recipient },
        data: {
          emailStatus: status,
          confidence: status === "VALID" ? 85 : status === "INVALID" ? 50 : undefined,
          provenance: {
            source: "resend_webhook",
            eventType,
            receivedAt: new Date().toISOString(),
          } as any,
        },
      });
    }

    return NextResponse.json({ ok: true, eventType, recipient, status }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
