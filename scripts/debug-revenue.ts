
import { prismadb } from "../lib/prisma";

async function main() {
    console.log("--- Debugging Last Updated Opportunity ---");

    // Try finding in CRM Opportunities first
    const lastCrmOpp = await prismadb.crm_Opportunities.findFirst({
        orderBy: { updatedAt: 'desc' },
        include: { invoices: true }
    });

    if (lastCrmOpp) {
        console.log(`[CRM Opportunity] ID: ${lastCrmOpp.id}`);
        console.log(`Name: ${lastCrmOpp.name}`);
        console.log(`Status: ${lastCrmOpp.status}`);
        console.log(`Expected Revenue: ${lastCrmOpp.expected_revenue}`);
        console.log(`Budget: ${lastCrmOpp.budget}`);

        console.log("\n--- Connected Invoices ---");
        lastCrmOpp.invoices.forEach(inv => {
            console.log(`Invoice ID: ${inv.id}`);
            console.log(`Amount (Raw): ${inv.invoice_amount}`);
            const clean = inv.invoice_amount?.replace(/[^0-9.]/g, '') || "0";
            console.log(`Amount (Clean): ${clean}`);
        });
    } else {
        console.log("No CRM Opportunities found.");
    }

    // Also check Project Opportunities just in case
    const lastProjOpp = await (prismadb as any).project_Opportunities.findFirst({
        // removing orderBy for now to avoid errors if field missing, or use id/createdAt if known
        include: { invoices: true }
    });

    if (lastProjOpp) {
        console.log(`\n[Project Opportunity] ID: ${lastProjOpp.id}`);
        console.log(`Value Estimate: ${lastProjOpp.valueEstimate}`);
        if (lastProjOpp.invoices) {
            lastProjOpp.invoices.forEach((inv: any) => {
                console.log(`Invoice ID: ${inv.id}`);
                console.log(`Amount (Raw): ${inv.invoice_amount}`);
            });
        }
    }

}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prismadb.$disconnect();
    });
