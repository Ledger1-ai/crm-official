
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { processInvoiceFromDocument } from "@/lib/invoice-processor";

export const runtime = 'nodejs'; // Ensure Node runtime for canvas/pdf-parse

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const teamInfo = await getCurrentUserTeamId();
        const teamId = teamInfo?.teamId;

        // Look for recent documents (last 7 days to be safe)
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);

        console.log(`[INVOICE_REFETCH] Querying documents for team ${teamId} since ${cutoff.toISOString()}`);

        const documents = await prismadb.documents.findMany({
            where: {
                team_id: teamId,
                createdAt: {
                    gte: cutoff,
                },
                // Check if invoiceIDs is empty array (filtering in memory to be safe)
                // invoiceIDs: { isEmpty: true } 
            },
        });

        console.log(`[INVOICE_REFETCH] Initial query found ${documents.length} documents. Filtering for empty invoiceIDs...`);

        // Filter in memory
        const unprocessedDocs = documents.filter(d => !d.invoiceIDs || d.invoiceIDs.length === 0);
        console.log(`[INVOICE_REFETCH] Found ${unprocessedDocs.length} unprocessed documents after filter.`);

        // Fallback: If 0 found, try finding ANY document to see if teamId is correct
        if (unprocessedDocs.length === 0) {
            const recentDocs = await prismadb.documents.findMany({
                where: { team_id: teamId },
                take: 3,
                orderBy: { createdAt: 'desc' }
            });
            console.log("[INVOICE_REFETCH] Debug: Recent docs in team:", recentDocs.map(d => ({ id: d.id, created: d.createdAt, invs: d.invoiceIDs })));
        }

        let processedCount = 0;
        for (const doc of unprocessedDocs) {
            try {
                await processInvoiceFromDocument(doc.id, session.user.id, teamId);
                processedCount++;
            } catch (error) {
                console.error(`[INVOICE_REFETCH] Failed to process document ${doc.id}:`, error);
            }
        }

        return NextResponse.json({ processed: processedCount, totalFound: unprocessedDocs.length });
    } catch (error) {
        console.error("[INVOICE_REFETCH] Internal Error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
