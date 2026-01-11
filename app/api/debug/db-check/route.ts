
import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const invoices = await (prismadb.invoices as any).findMany({
            take: 10,
            orderBy: { date_created: 'desc' },
            include: {
                documents: true // Correct relation name inferred from error
            }
        });

        // Also check documents
        const documents = await (prismadb.documents as any).findMany({
            take: 10,
            orderBy: { date_created: 'desc' }
        });

        return NextResponse.json({
            summary: `Found ${invoices.length} invoices and ${documents.length} documents.`,
            invoices,
            documents
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
