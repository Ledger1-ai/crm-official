import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCalendarClientForUser } from "@/lib/gmail";

/**
 * GET /api/calendar/list
 * Returns the list of calendars available for the authenticated user.
 *
 * Response: { ok: true, calendars: Array<{ id: string; summary: string; primary?: boolean }> }
 */
export async function GET(_req: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    const userId = (session as any)?.user?.id as string | undefined;
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const calendar = await getCalendarClientForUser(userId);
    if (!calendar) {
      return NextResponse.json({ ok: false, connected: false, error: "Google not connected" }, { status: 404 });
    }

    // Paginate through all pages to ensure all calendars are detected
    let calendars: Array<{ id: string; summary: string; primary?: boolean }> = [];
    let pageToken: string | undefined = undefined;

    do {
      const pageRes: any = await calendar.calendarList.list({
        maxResults: 250,
        showHidden: true,
        pageToken,
      });
      pageToken = (pageRes as any).data?.nextPageToken || undefined;

      const items: any[] = Array.isArray((pageRes as any).data?.items) ? (pageRes as any).data.items : [];
      const batch = items
        .map((c: any) => ({
          id: c?.id || "",
          summary: c?.summary || c?.id || "",
          primary: !!c?.primary,
        }))
        .filter((c: any) => !!c.id);

      calendars = calendars.concat(batch);
    } while (pageToken);

    return NextResponse.json({ ok: true, calendars }, { status: 200 });
  } catch (e: any) {

    console.error("[CALENDAR_LIST_GET]", e?.message || e);
    // Fix: Return the actual error message to the frontend for debugging
    const errorMessage = e?.response?.data?.error?.message || e?.message || "Failed to list calendars";
    return new NextResponse(errorMessage, { status: 500 });
  }
}
