
import { processInvoiceFromDocument } from "../lib/invoice-processor";
import { prismadb } from "../lib/prisma";

async function main() {
    const documentId = "6962ce19197aaceed4b3a292"; // ID from user request
    // We need a user ID, I'll try to fetch the document's assigned user or just use a placeholder if not critical for the test function itself,
    // but the function takes userId.

    const doc = await prismadb.documents.findUnique({ where: { id: documentId } });
    if (!doc) {
        console.error("Document not found!");
        return;
    }

    console.log("Found document:", doc.id);

    try {
        const invoice = await processInvoiceFromDocument(doc.id, doc.assigned_user || "test-user", doc.team_id);
        console.log("Successfully processed invoice:", invoice);
    } catch (e) {
        console.error("Error processing invoice:", e);
    }
}

main();
