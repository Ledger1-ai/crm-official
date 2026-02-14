import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sendEmail from "@/lib/sendmail";
import { prismadb } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return new NextResponse("Unauthenticated", { status: 401 });
    }

    try {
        const body = await req.json();
        const { to, subject, text, leadId, contactId, accountId, trackClicks, trackOpens } = body;

        if (!to || !subject || !text) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const userId = session.user.id;
        const trackingToken = crypto.randomBytes(16).toString("hex");
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        let processedHtml = text.replace(/\n/g, '<br/>');

        // 1. CTR Tracking (Link Wrapping)
        if (trackClicks) {
            processedHtml = processedHtml.replace(
                /https?:\/\/[^\s<]+/g,
                (url: string) => `${baseUrl}/api/email/track/click?token=${trackingToken}&url=${encodeURIComponent(url)}`
            );
        }

        // 2. Open Tracking (Pixel)
        if (trackOpens) {
            processedHtml += `<img src="${baseUrl}/api/email/track/open?token=${trackingToken}" width="1" height="1" style="display:none;" />`;
        }

        // 3. Log Activity to CRM
        let targetLeadId = leadId;

        // If no leadId provided, try to find one by email
        if (!targetLeadId && to) {
            const lead = await prismadb.crm_Leads.findFirst({
                where: { email: to }
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
                        subject,
                        trackingToken,
                        recipient: to
                    }
                }
            });

            // Also create an Outreach Item for detailed tracking
            let adhocCampaign = await prismadb.crm_Outreach_Campaigns.findFirst({
                where: { name: "Ad-hoc Emails", user: userId }
            });

            if (!adhocCampaign) {
                adhocCampaign = await prismadb.crm_Outreach_Campaigns.create({
                    data: {
                        name: "Ad-hoc Emails",
                        user: userId,
                        status: "ACTIVE",
                        v: 0
                    }
                });
            }

            await prismadb.crm_Outreach_Items.create({
                data: {
                    campaign: adhocCampaign.id,
                    lead: targetLeadId,
                    channel: "EMAIL",
                    status: "SENT",
                    subject,
                    body_text: text,
                    body_html: processedHtml,
                    tracking_token: trackingToken,
                    sentAt: new Date(),
                    v: 0
                }
            });
        }

        // 4. Dispatch Email
        await sendEmail({
            from: process.env.EMAIL_FROM,
            to,
            subject,
            text, // Plain text fallback
            html: processedHtml,
        });

        return NextResponse.json({ message: "Email sent successfully", token: trackingToken });
    } catch (error) {
        console.error("[EMAIL_SEND_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
