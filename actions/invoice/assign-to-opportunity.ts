"use server";

import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export async function assignInvoiceToOpportunity(invoiceId: string, opportunityId: string, type: string = "crm_opportunity") {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            throw new Error("Unauthorized");
        }

        const invoice = await prismadb.invoices.findUnique({
            where: { id: invoiceId },
        });

        if (!invoice) throw new Error("Invoice not found");

        let amountInt = 0;
        if (invoice.invoice_amount) {
            const clean = invoice.invoice_amount.replace(/[^0-9.]/g, '');
            const floatVal = parseFloat(clean);
            if (!isNaN(floatVal)) {
                amountInt = Math.round(floatVal);
            }
        }

        if (type === "project_opportunity") {
            // Handle Project Opportunity (Feature)
            const opportunity = await prismadb.project_Opportunities.findUnique({
                where: { id: opportunityId },
            });
            if (!opportunity) throw new Error("Project Opportunity not found");

            // Link in Invoice
            await prismadb.invoices.update({
                where: { id: invoiceId },
                data: {
                    project_opportunities: {
                        connect: { id: opportunityId }
                    },
                },
            });

            // Link in Project Opportunity AND Update Value
            await prismadb.project_Opportunities.update({
                where: { id: opportunityId },
                data: {
                    invoices: {
                        connect: { id: invoiceId }
                    },
                    valueEstimate: amountInt, // Update estimate
                },
            });

        } else {
            // Handle CRM Opportunity (Default)
            const opportunity = await prismadb.crm_Opportunities.findUnique({
                where: { id: opportunityId },
            });
            if (!opportunity) throw new Error("Opportunity not found");

            await prismadb.invoices.update({
                where: { id: invoiceId },
                data: {
                    opportunities: {
                        connect: { id: opportunityId }
                    },
                },
            });

            await prismadb.crm_Opportunities.update({
                where: { id: opportunityId },
                data: {
                    invoices: {
                        connect: { id: invoiceId }
                    },
                    budget: amountInt,
                    expected_revenue: amountInt,
                },
            });
        }

        revalidatePath("/invoice");
        return { success: true };

        revalidatePath("/invoice");
        revalidatePath(`/crm/opportunities/${opportunityId}`);

        return { success: true };
    } catch (error) {
        console.error("[ASSIGN_OPPORTUNITY]", error);
        return { error: "Failed to assign opportunity" };
    }
}
