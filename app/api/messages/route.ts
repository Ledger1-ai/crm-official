import { getServerSession } from "next-auth";
import sendEmail from "@/lib/sendmail";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import crypto from "crypto";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const teamId = (session.user as any).team_id;

        if (!teamId) {
            return NextResponse.json({ error: "No team associated" }, { status: 400 });
        }

        const messages = await prismadb.internalMessage.findMany({
            where: {
                OR: [
                    { sender_id: userId },
                    { recipients: { some: { recipient_id: userId } } },
                ],
                team_id: teamId,
            },
            include: {
                recipients: true,
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        });

        return NextResponse.json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const teamId = (session.user as any).team_id;

        if (!teamId) {
            return NextResponse.json({ error: "No team associated" }, { status: 400 });
        }

        const body = await req.json();
        let { recipient_ids, subject, body_text, body_html, priority, labels, status, send_email, recipient_email, trackClicks, trackOpens } = body;

        // Normalize recipient_ids
        if (!recipient_ids) recipient_ids = [];

        // Identify email recipients from input
        const emailRecipients: string[] = [];
        const validUserIds: string[] = [];

        // Check if recipient_email was passed explicitly or in recipient_ids
        if (recipient_email) emailRecipients.push(recipient_email);

        for (const id of recipient_ids) {
            if (id.includes("@")) {
                emailRecipients.push(id);
            } else {
                validUserIds.push(id);
            }
        }

        // Try to resolve emails to user IDs to store in InternalMessage
        for (const email of emailRecipients) {
            const user = await prismadb.users.findUnique({ where: { email } });
            if (user) {
                if (!validUserIds.includes(user.id)) {
                    validUserIds.push(user.id);
                }
            }
        }

        // If we have valid user IDs, we can create an InternalMessage
        let message = null;
        if (validUserIds.length > 0) {
            // Get sender info
            const sender = await prismadb.users.findUnique({
                where: { id: userId },
                select: { name: true, email: true },
            });

            message = await prismadb.internalMessage.create({
                data: {
                    sender_id: userId,
                    sender_name: sender?.name,
                    sender_email: sender?.email,
                    subject,
                    body_text,
                    body_html,
                    status: status || "SENT",
                    priority: priority || "NORMAL",
                    labels: labels || [],
                    team_id: teamId,
                    sentAt: new Date(),
                    recipients: {
                        create: validUserIds.map((recipientId: string) => ({
                            recipient_id: recipientId,
                            recipient_type: "TO",
                        })),
                    },
                },
                include: {
                    recipients: true,
                },
            });
        }

        // Send emails
        if (send_email) {
            const allEmails = new Set<string>(emailRecipients);

            // Add emails from validUserIds if they weren't in the input
            if (validUserIds.length > 0) {
                const users = await prismadb.users.findMany({
                    where: { id: { in: validUserIds } },
                    select: { email: true }
                });
                users.forEach(u => {
                    if (u.email) allEmails.add(u.email);
                });
            }

            // Get sender info (if not already fetched)
            const sender = await prismadb.users.findUnique({
                where: { id: userId },
                select: { name: true, email: true },
            });

            await Promise.all(Array.from(allEmails).map(async (email) => {
                try {
                    const trackingToken = crypto.randomBytes(16).toString("hex");
                    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

                    let processedHtml = body_html || `<p>${body_text || ""}</p><br/><p><small>Sent by ${sender?.name}</small></p>`;
                    processedHtml = processedHtml.replace(/\n/g, '<br/>');

                    // CTR Tracking
                    if (trackClicks) {
                        processedHtml = processedHtml.replace(
                            /https?:\/\/[^\s<]+/g,
                            (url: string) => `${baseUrl}/api/email/track/click?token=${trackingToken}&url=${encodeURIComponent(url)}`
                        );
                    }

                    // Open Tracking
                    if (trackOpens) {
                        processedHtml += `<img src="${baseUrl}/api/email/track/open?token=${trackingToken}" width="1" height="1" style="display:none;" />`;
                    }

                    // Try to find a lead or contact with this email to log activity
                    const lead = await prismadb.crm_Leads.findFirst({ where: { email } });
                    const contact = await prismadb.crm_Contacts.findFirst({ where: { email } });

                    if (lead) {
                        await prismadb.crm_Lead_Activities.create({
                            data: {
                                lead: lead.id,
                                user: userId,
                                type: "EMAIL",
                                metadata: { subject, trackingToken, recipient: email }
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
                                lead: lead.id,
                                channel: "EMAIL",
                                status: "SENT",
                                subject,
                                body_text: body_text || "",
                                body_html: processedHtml,
                                tracking_token: trackingToken,
                                sentAt: new Date(),
                                v: 0
                            }
                        });
                    }

                    await sendEmail({
                        to: email,
                        subject: subject, // Removed "New Message:" prefix to match SmartEmail style
                        text: body_text || "You have a new message.",
                        html: processedHtml
                    });
                } catch (err) {
                    console.error(`Failed to send email to ${email}:`, err);
                }
            }));
        }

        if (message) {
            return NextResponse.json(message);
        } else if (send_email && emailRecipients.length > 0) {
            // Return a dummy success if we only sent emails but didn't save to DB (because no valid users found)
            return NextResponse.json({ success: true, message: "Email sent." });
        } else {
            return NextResponse.json({ error: "No valid recipients" }, { status: 400 });
        }
    } catch (error) {
        console.error("Error creating message:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
