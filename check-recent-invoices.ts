
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("Checking recent invoices...");
    const invoices = await prisma.invoices.findMany({
        take: 5,
        orderBy: {
            date_created: 'desc'
        },
        include: {
            documents: true
        }
    });

    console.log(`Found ${invoices.length} recent invoices.`);
    invoices.forEach(inv => {
        console.log("------------------------------------------------");
        console.log(`ID: ${inv.id}`);
        console.log(`Created: ${inv.date_created}`);
        console.log(`Status: ${inv.status}`);
        console.log(`Team ID: ${inv.team_id}`);
        console.log(`User ID: ${inv.assigned_user_id}`);
        console.log(`Doc count: ${inv.documents.length}`);
        if (inv.documents.length > 0) {
            console.log(`Doc Name: ${inv.documents[0].document_name}`);
        }
    });

    // also check documents for that user
    console.log("\nChecking recent documents...");
    const docs = await prisma.documents.findMany({
        take: 5,
        orderBy: {
            date_created: 'desc'
        }
    });
    docs.forEach(doc => {
        console.log(`Doc ID: ${doc.id} | Name: ${doc.document_name} | Team: ${doc.team_id} | Invoices: ${doc.invoiceIDs}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
