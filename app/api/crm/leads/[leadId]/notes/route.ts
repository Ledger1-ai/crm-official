import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

// GET /api/crm/leads/:leadId/notes
// Returns recent notes (lead activities of type "note"). Non-admins only for their assigned leads.
type Params = { params: Promise<{ leadId: string }> };
export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { leadId } = await params;
    if (!leadId) return new NextResponse("Missing leadId", { status: 400 });

    const user = await prismadb.users.findUnique({
      where: { id: session.user.id },
      select: { is_admin: true, is_account_admin: true },
    });
    const isAdmin = !!(user?.is_admin || user?.is_account_admin);

    if (!isAdmin) {
      const lead = await prismadb.crm_Leads.findUnique({
        where: { id: leadId },
        select: { assigned_to: true },
      });
      if (!lead || lead.assigned_to !== session.user.id) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }

    const notes = await prismadb.crm_Lead_Activities.findMany({
      where: { lead: leadId, type: "note" },
      orderBy: { createdAt: "desc" as const },
      take: 50,
      select: { id: true, type: true, metadata: true, createdAt: true },
    });

    return NextResponse.json({ notes }, { status: 200 });
  } catch (error) {
    console.error("[LEAD_NOTES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST /api/crm/leads/:leadId/notes
// Body: { text: string, mentions?: string[] }
// Creates a lead activity of type "note" with metadata storing text and mentions.
export async function POST(req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { leadId } = await params;
    if (!leadId) return new NextResponse("Missing leadId", { status: 400 });

    const payload = await req.json().catch(() => ({}));
    const rawText = String(payload?.text ?? "");
    const mentions = Array.isArray(payload?.mentions) ? payload.mentions.map((m: any) => String(m)).slice(0, 20) : [];

    if (!rawText.trim()) {
      return new NextResponse("text is required", { status: 400 });
    }

    // Restrict to assigned leads if not admin
    const user = await prismadb.users.findUnique({
      where: { id: session.user.id },
      select: { is_admin: true, is_account_admin: true },
    });
    const isAdmin = !!(user?.is_admin || user?.is_account_admin);

    if (!isAdmin) {
      const lead = await prismadb.crm_Leads.findUnique({
        where: { id: leadId },
        select: { assigned_to: true },
      });
      if (!lead || lead.assigned_to !== session.user.id) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }

    await prismadb.crm_Lead_Activities.create({
      data: {
        lead: leadId,
        user: session.user.id,
        type: "note",
        metadata: {
          text: rawText.slice(0, 20000),
          mentions,
        } as any,
      },
    });

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("[LEAD_NOTES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
