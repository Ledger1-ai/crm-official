import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

// POST /api/crm/leads/:leadId/activities/transcript
// Body: { text: string; contactId?: string; role?: string; segmentAt?: string | number; extra?: any }
// Creates an activity entry for a transcript segment during a live call

type Params = { params: Promise<{ leadId: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { leadId } = await params;
    if (!leadId) return new NextResponse("Missing leadId", { status: 400 });

    const payload = await req.json().catch(() => null);
    const text = String(payload?.text || "").trim();
    if (!text) return new NextResponse("Missing transcript text", { status: 400 });
    const contactId = payload?.contactId ? String(payload.contactId) : undefined;
    const role = payload?.role ? String(payload.role) : undefined; // e.g., agent|customer|system
    const segmentAt = payload?.segmentAt ? Number(payload.segmentAt) : Date.now();
    const extra = payload?.extra || undefined;

    // Determine admin privileges
    const user = await prismadb.users.findUnique({
      where: { id: session.user.id },
      select: { is_admin: true, is_account_admin: true },
    });
    const isAdmin = !!(user?.is_admin || user?.is_account_admin);

    // If not admin, verify the lead belongs to current user
    if (!isAdmin) {
      const lead = await prismadb.crm_Leads.findUnique({
        where: { id: leadId },
        select: { assigned_to: true },
      });
      if (!lead || lead.assigned_to !== session.user.id) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }

    const activity = await prismadb.crm_Lead_Activities.create({
      data: {
        lead: leadId,
        user: session.user.id,
        type: "call_transcript_segment",
        metadata: {
          text,
          contactId,
          role,
          segmentAt,
          extra,
        } as any,
      },
      select: { id: true, type: true, metadata: true, createdAt: true },
    });

    return NextResponse.json({ saved: true, activity }, { status: 200 });
  } catch (error: any) {
    console.error("[LEAD_TRANSCRIPT_POST]", error?.message || error);
    return new NextResponse(error?.message || "Internal Error", { status: 500 });
  }
}
