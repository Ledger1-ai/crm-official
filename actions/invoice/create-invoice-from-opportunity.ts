"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type ActionResponse = {
    success: boolean;
    data?: any;
    error?: string;
};

export async function createInvoiceFromOpportunity(opportunityId: string): Promise<ActionResponse> {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        const opportunity = await prismadb.crm_Opportunities.findUnique({
            where: { id: opportunityId },
            include: {
                assigned_account: true,
                contacts: true,
            },
        });

        if (!opportunity) {
            return { success: false, error: "Opportunity not found" };
        }

        // Determine client details
        let partnerName = "";
        let partnerEmail = "";
        let partnerAddress = "";

        if (opportunity.assigned_account) {
            partnerName = opportunity.assigned_account.name;
            partnerEmail = opportunity.assigned_account.email || "";
            // Address details if available on account
            partnerAddress = opportunity.assigned_account.billing_street || "";
        } else if (opportunity.contacts.length > 0) {
            const contact = opportunity.contacts[0];
            partnerName = `${contact.first_name || ""} ${contact.last_name}`.trim();
            partnerEmail = contact.email || "";
        } else {
            // Fallback to Opportunity Name if no account/contact?
            // Or just leave blank.
            partnerName = "Unknown Client";
        }

        // Create Invoice
        const newInvoice = await prismadb.invoices.create({
            data: {
                v: 0,
                date_created: new Date(),
                date_received: new Date(),
                date_due: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Due in 14 days
                description: `Invoice for ${opportunity.name}`,
                invoice_number: `INV-${Date.now()}`, // Temporary basic generation
                invoice_amount: opportunity.expected_revenue?.toString() || "0",
                invoice_currency: opportunity.currency || "USD",
                partner: partnerName,
                partner_email: partnerEmail,
                payment_status: "UNPAID",
                visibility: true,
                assigned_user_id: session.user.id,
                assigned_account_id: opportunity.account,
                opportunityIDs: [opportunityId], // Link back
                team_id: opportunity.team_id,
                // Mandatory helper fields
                invoice_file_mimeType: "application/pdf",
                invoice_file_url: "", // Empty until generated
                // Items
                invoice_items: [
                    {
                        description: opportunity.name || "Services",
                        quantity: 1,
                        unit_price: opportunity.expected_revenue || 0,
                        total_price: opportunity.expected_revenue || 0
                    }
                ]
            },
        });

        // Link Invoice to Opportunity (inverse relation update if needed, but we did it via connect ids)
        // Check if `invoices` relation on Opportunity needs manual update? 
        // Schema: `invoiceIDs String[] @db.ObjectId` on Opportunity.
        // `opportunityIDs` on Invoice.
        // It's a many-to-many via array of IDs on both sides usually in Mongo, but let's check schema.
        // Opportunity has `invoiceIDs` and `invoices` relation fields.

        await prismadb.crm_Opportunities.update({
            where: { id: opportunityId },
            data: {
                invoiceIDs: { push: newInvoice.id }
            }
        });

        revalidatePath(`/crm/opportunities/${opportunityId}`);
        revalidatePath("/invoice");

        return {
            success: true,
            data: { invoiceId: newInvoice.id }
        };

    } catch (error: any) {
        console.error("[CREATE_INVOICE]", error);
        return { success: false, error: error.message || "Failed to create invoice" };
    }
}
