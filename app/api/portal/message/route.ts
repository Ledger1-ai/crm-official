/**
 * Portal Message API
 * Create and send messages to portal recipients
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { sendPortalNotificationSms } from "@/lib/aws/eum-sms";
import crypto from "crypto";

// POST - Create and send a message
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            portalId,
            subject,
            bodyText,
            bodyHtml,
            mobileHtml,
            recipientIds,
            sendSms,
        } = body;

        if (!portalId || !subject || !bodyText) {
            return NextResponse.json({
                error: "Missing required fields: portalId, subject, bodyText"
            }, { status: 400 });
        }

        // Get portal
        const portal = await (prismadb as any).crm_Message_Portal.findUnique({
            where: { id: portalId },
        });

        if (!portal) {
            return NextResponse.json({ error: "Portal not found" }, { status: 404 });
        }

        // Get sender info from session
        const user = await prismadb.users.findUnique({
            where: { id: session.user.id },
            select: { name: true, email: true, avatar: true },
        });

        // Create the message
        const message = await (prismadb as any).crm_Portal_Message.create({
            data: {
                portal: portalId,
                subject,
                body_text: bodyText,
                body_html: bodyHtml || null,
                mobile_html: mobileHtml || null,
                sender_name: user?.name || session.user.name || "User",
                sender_email: user?.email || session.user.email,
                sender_avatar: user?.avatar || null,
                sent_by: session.user.id,
                sentAt: new Date(),
            },
        });

        // Get recipients
        let recipients;
        if (recipientIds?.length) {
            recipients = await (prismadb as any).crm_Portal_Recipient.findMany({
                where: {
                    id: { in: recipientIds },
                    portal: portalId,
                    is_opted_out: false,
                },
            });
        } else {
            recipients = await (prismadb as any).crm_Portal_Recipient.findMany({
                where: {
                    portal: portalId,
                    is_opted_out: false,
                },
            });
        }

        // Link message to recipients and optionally send SMS
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://app.ledger1.ai";
        const results: { recipientId: string; linked: boolean; smsSent?: boolean; error?: string }[] = [];

        for (const recipient of recipients) {
            // Create message-recipient link
            const link = await (prismadb as any).crm_Portal_Message_Recipient.create({
                data: {
                    message: message.id,
                    recipient: recipient.id,
                },
            });

            const result: any = { recipientId: recipient.id, linked: true };

            // Send SMS if requested and recipient has phone
            if (sendSms && recipient.phone) {
                const portalLink = `${baseUrl}/portal/${portal.portal_slug}/m/${recipient.access_token}`;
                const smsText = buildNotificationSms(
                    recipient.first_name,
                    message.sender_name || portal.portal_name || "Ledger1",
                    portalLink
                );

                try {
                    const smsResult = await sendPortalNotificationSms(recipient.phone, smsText);

                    // Update link with SMS status
                    await (prismadb as any).crm_Portal_Message_Recipient.update({
                        where: { id: link.id },
                        data: {
                            sms_sent: true,
                            sms_sent_at: new Date(),
                            sms_message_id: smsResult?.messageId,
                            sms_status: smsResult?.messageId ? "sent" : "failed",
                        },
                    });

                    result.smsSent = !!smsResult?.messageId;
                } catch (err: any) {
                    result.smsSent = false;
                    result.error = err.message;
                }
            }

            results.push(result);
        }

        const linked = results.filter(r => r.linked).length;
        const smsSent = results.filter(r => r.smsSent).length;

        return NextResponse.json({
            success: true,
            message: {
                id: message.id,
                subject: message.subject,
            },
            recipients: {
                total: recipients.length,
                linked,
                smsSent,
            },
            results,
        });
    } catch (err: any) {
        console.error("[Portal Message API] Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

function buildNotificationSms(
    firstName: string | null,
    senderName: string,
    portalLink: string
): string {
    const greeting = firstName ? `${firstName}, you` : "You";
    return `${greeting} have a new message from ${senderName}. View it here: ${portalLink} Reply STOP to unsubscribe.`;
}
