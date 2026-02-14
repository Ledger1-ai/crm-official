import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncGmailForUser } from "@/actions/crm/sync-emails";

export const dynamic = "force-dynamic";

/**
 * GET /api/gmail/sync?days=7
 * Pulls recent threads from Gmail and updates pipeline stages when replies are detected.
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const daysParam = url.searchParams.get("days");
    const days = Math.max(1, Math.min(365, parseInt(daysParam || "7", 10) || 7));

    const result = await syncGmailForUser(session.user.id, days);

    if (!result.success) {
      return new NextResponse(result.error || "Sync failed", { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("[GMAIL_SYNC_GET]", error?.message || error);
    return new NextResponse("Failed to sync Gmail", { status: 500 });
  }
}
