
import { prismadb } from "../lib/prisma";

async function main() {
    console.log("--- Fixing Invoice Assignment ---");

    const projectOppId = "695d8e0299a4956d1ead5033";
    const crmOppId = "69684359ce59bb0edf359d56";

    console.log(`Moving invoices from Project Opp ${projectOppId} to CRM Opp ${crmOppId}...`);

    // 1. Fetch Invoices from Project Opp
    const projectOpp = await (prismadb as any).project_Opportunities.findUnique({
        where: { id: projectOppId },
        include: { invoices: true }
    });

    if (!projectOpp || !projectOpp.invoices || projectOpp.invoices.length === 0) {
        console.log("No invoices found on Project Opportunity.");
        return;
    }

    const invoiceIds = projectOpp.invoices.map((inv: any) => inv.id);
    console.log(`Found ${invoiceIds.length} invoices:`, invoiceIds);

    // 2. Disconnect from Project Opp
    await (prismadb as any).project_Opportunities.update({
        where: { id: projectOppId },
        data: {
            invoices: {
                disconnect: invoiceIds.map((id: string) => ({ id }))
            },
            valueEstimate: 0 // Reset value
        }
    });
    console.log("Disconnected from Project Opportunity.");

    // 3. Connect to CRM Opp
    await prismadb.crm_Opportunities.update({
        where: { id: crmOppId },
        data: {
            invoices: {
                connect: invoiceIds.map((id: string) => ({ id }))
            }
        }
    });

    // 4. Update Invoices back-link (for good measure, though connect should handle it if many-to-many?)
    // Prisma many-to-many handles the join, but let's be safe if there are scalar fields.
    // Schema says: 
    // invoiceIDs String[] @db.ObjectId
    // invoices Invoices[] @relation(fields: [invoiceIDs], references: [id])
    // So 'connect' in step 3 works.

    // NOTE: Invoices also have `opportunityIDs` and `opportunities` relation.
    // We should update the Invoice side too if needed?
    // Invoice model: 
    // opportunityIDs String[] @db.ObjectId
    // opportunities  crm_Opportunities[] @relation(fields: [opportunityIDs], references: [id])
    // projectOpportunityIDs String[] @db.ObjectId
    // project_opportunities Project_Opportunities[] @relation(fields: [projectOpportunityIDs], references: [id])

    // So we need to update the invoices to remove project connection and add crm connection on THEIR side too?
    // Prisma 'connect' usually handles the other side if relation is properly defined.
    // But let's verify.

    // 5. Recalculate CRM Revenue
    const updatedCrmOpp = await prismadb.crm_Opportunities.findUnique({
        where: { id: crmOppId },
        include: { invoices: true }
    });

    const totalRevenue = updatedCrmOpp?.invoices.reduce((acc, inv) => {
        const val = parseFloat(inv.invoice_amount?.replace(/[^0-9.]/g, '') || "0");
        return acc + (isNaN(val) ? 0 : val);
    }, 0) || 0;

    console.log(`New CRM Opportunity Revenue: ${totalRevenue}`);

    await prismadb.crm_Opportunities.update({
        where: { id: crmOppId },
        data: {
            budget: Math.round(totalRevenue),
            expected_revenue: Math.round(totalRevenue),
        }
    });

    console.log("Successfully moved invoices and updated revenue.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prismadb.$disconnect();
    });
