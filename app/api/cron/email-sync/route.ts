import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { requireCronAuth } from "@/lib/api-auth-guard";
import { syncGmailForUser, syncOutlookForUser } from "@/actions/crm/sync-emails";

export const maxDuration = 300; // Allow 5 minutes max for batch syncing

/**
 * GET /api/cron/email-sync
 * Iterates through all users with connected email accounts and triggers sync.
 */
export async function GET(req: Request) {
    const cronAuth = requireCronAuth(req);
    if (cronAuth instanceof Response) return cronAuth;

    try {
        // Find users with Gmail tokens
        const gmailUsers = await prismadb.gmail_Tokens.findMany({
            select: { user: true }
        });

        // Find users with Microsoft tokens
        const microsoftUsers = await prismadb.microsoft_Tokens.findMany({
            select: { user: true }
        });

        const results = {
            gmail: { success: 0, failed: 0 },
            outlook: { success: 0, failed: 0 },
            totalLeadsUpdated: 0
        };

        // Sync Gmail users
        for (const token of gmailUsers) {
            if (!token.user) continue;
            const res = await syncGmailForUser(token.user, 3); // Last 3 days for cron
            if (res.success) {
                results.gmail.success++;
                results.totalLeadsUpdated += res.leadsUpdated || 0;
            } else {
                results.gmail.failed++;
            }
        }

        // Sync Outlook users
        for (const token of microsoftUsers) {
            if (!token.user) continue;
            const res = await syncOutlookForUser(token.user, 3);
            if (res.success) {
                results.outlook.success++;
                results.totalLeadsUpdated += res.leadsUpdated || 0;
            } else {
                results.outlook.failed++;
            }
        }

        return NextResponse.json({
            status: "Batch sync complete",
            results
        }, { status: 200 });

    } catch (error: any) {
        console.error("Critical error in email sync cron:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
