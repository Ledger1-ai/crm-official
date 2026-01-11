
import { prismadb } from "@/lib/prisma";

async function main() {
    const docId = "6962ce19197aaceed4b3a292";
    const doc = await prismadb.documents.findUnique({
        where: { id: docId },
    });

    if (!doc) {
        console.log("Document not found");
        return;
    }

    console.log("Document details:");
    console.log("ID:", doc.id);
    console.log("Team ID:", doc.team_id);
    console.log("Created At:", doc.createdAt);
    console.log("Invoice IDs:", doc.invoiceIDs);

    // Also check if any invoices exist for this doc
    const invoices = await prismadb.invoices.findMany({
        where: {
            connected_documents: {
                has: docId
            }
        }
    });
    console.log("Linked Invoices found in DB (reverse lookup):", invoices.length);
}

main();
