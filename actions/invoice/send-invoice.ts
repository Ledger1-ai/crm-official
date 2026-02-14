
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { sendEmailSES } from "@/lib/aws/ses";
import crypto from "crypto";

export async function sendInvoice(invoiceId: string, email: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { error: "Unauthorized" };

        const invoice = await prismadb.invoices.findUnique({
            where: { id: invoiceId },
        });

        if (!invoice) return { error: "Invoice not found" };

        const paymentLink = invoice.surge_payment_link;
        if (!paymentLink) return { error: "No payment link generated. Enable Crypto Payments first." };

        const userId = session.user.id;
        const trackingToken = crypto.randomBytes(16).toString("hex");
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        // CTR Tracking for the payment link
        const trackedPaymentLink = `${baseUrl}/api/email/track/click?token=${trackingToken}&url=${encodeURIComponent(paymentLink)}`;

        // Open Tracking Pixel
        const trackingPixel = `<img src="${baseUrl}/api/email/track/open?token=${trackingToken}" width="1" height="1" style="display:none;" />`;

        // Log Activity to CRM if we can link to a lead
        let targetLeadId = null;
        if (invoice.assigned_account_id) {
            const lead = await prismadb.crm_Leads.findFirst({
                where: { accountsIDs: invoice.assigned_account_id }
            });
            if (lead) targetLeadId = lead.id;
        }

        if (targetLeadId) {
            await prismadb.crm_Lead_Activities.create({
                data: {
                    lead: targetLeadId,
                    user: userId,
                    type: "EMAIL",
                    metadata: {
                        subject: `Invoice #${invoice.invoice_number} Payment Link`,
                        trackingToken,
                        recipient: email,
                        invoiceId: invoice.id
                    }
                }
            });

            // Create an Outreach Item for tracking
            let adhocCampaign = await prismadb.crm_Outreach_Campaigns.findFirst({
                where: { name: "Ad-hoc Emails", user: userId }
            });

            if (!adhocCampaign) {
                adhocCampaign = await prismadb.crm_Outreach_Campaigns.create({
                    data: { name: "Ad-hoc Emails", user: userId, status: "ACTIVE", v: 0 }
                });
            }

            await prismadb.crm_Outreach_Items.create({
                data: {
                    campaign: adhocCampaign.id,
                    lead: targetLeadId,
                    channel: "EMAIL",
                    status: "SENT",
                    subject: `Invoice #${invoice.invoice_number} Payment Link`,
                    body_text: `Here is your payment link for Invoice #${invoice.invoice_number}: ${paymentLink}`,
                    body_html: `<p>Here is your payment link for Invoice <strong>#${invoice.invoice_number}</strong>:</p><p><a href="${trackedPaymentLink}">${paymentLink}</a></p>${trackingPixel}`,
                    tracking_token: trackingToken,
                    sentAt: new Date(),
                    v: 0
                }
            });
        }

        // Send Email via AWS SES
        try {
            await sendEmailSES({
                to: email,
                subject: `Invoice #${invoice.invoice_number} Payment Link`,
                text: `Here is your payment link for Invoice #${invoice.invoice_number}: ${paymentLink}`,
                html: `<p>Here is your payment link for Invoice <strong>#${invoice.invoice_number}</strong>:</p>
                       <p><a href="${trackedPaymentLink}">${paymentLink}</a></p>${trackingPixel}`,
            });
            console.log(`[SendInvoice] Email sent to ${email} via SES (Tracked)`);
            return { success: true, message: "Email sent with tracking" };
        } catch (sesError: any) {
            console.error("[SendInvoice] SES Error:", sesError.message);
            return { error: "Failed to send email: " + sesError.message };
        }

    } catch (error) {
        console.error("Send Invoice Error:", error);
        return { error: "Failed to send invoice" };
    }
}
