import { render } from "@react-email/render";
import sendEmail from "@/lib/sendmail";
import MemberAssignmentEmail from "@/emails/MemberAssignment";
import { prismadb } from "@/lib/prisma";

interface SendAssignmentNotificationParams {
    memberEmail: string;
    memberName: string;
    memberId: string;
    senderId: string;
    teamId?: string; // Optional, if not provided will try to fetch from sender
    assignedByName: string;
    assignmentType: "project" | "pool";
    assignmentName: string;
    assignmentId: string;
    role?: string;
    description?: string;
}

/**
 * Send email notification AND internal message when a member is assigned to a project or lead pool
 */
export async function sendAssignmentNotification({
    memberEmail,
    memberName,
    memberId,
    senderId,
    teamId,
    assignedByName,
    assignmentType,
    assignmentName,
    assignmentId,
    role = "Member",
    description,
}: SendAssignmentNotificationParams): Promise<void> {
    const typeLabel = assignmentType === "project" ? "Project" : "Lead Pool";
    const subject = `🎯 You've been assigned to: ${assignmentName}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://basaltcrm.com";
    const dashboardUrl = `${appUrl}/en/crm/my-projects`;

    // 1. Send Email Notification
    try {
        const emailHtml = await render(
            MemberAssignmentEmail({
                memberName,
                assignedByName,
                assignmentType,
                assignmentName,
                role,
                projectDescription: description,
                appUrl,
                dashboardUrl,
            })
        );

        await sendEmail({
            from: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USERNAME,
            to: memberEmail,
            subject,
            text: `Hi ${memberName}, ${assignedByName} has assigned you to the ${typeLabel.toLowerCase()} "${assignmentName}". View your assignments at ${dashboardUrl}`,
            html: emailHtml,
        });

        console.log(`[NOTIFICATION] Assignment email sent to ${memberEmail} for ${assignmentType}: ${assignmentName}`);
    } catch (error) {
        console.error(`[NOTIFICATION] Failed to send assignment email to ${memberEmail}:`, error);
    }

    // 2. Create Internal CRM Message
    try {
        // If teamId not provided, try to find one from sender
        let targetTeamId = teamId;
        if (!targetTeamId) {
            const sender = await prismadb.users.findUnique({
                where: { id: senderId },
                select: { team_id: true }
            });
            targetTeamId = sender?.team_id || undefined;
        }

        if (!targetTeamId) {
            console.warn(`[NOTIFICATION] internal message skipped - no team_id found for sender ${senderId}`);
            return;
        }

        // Create the message
        const message = await prismadb.internalMessage.create({
            data: {
                sender_id: senderId,
                team_id: targetTeamId,
                subject: subject,
                body_text: `You have been assigned to the ${typeLabel.toLowerCase()} "${assignmentName}" as ${role}.`,
                body_html: `<p>Hi ${memberName},</p><p><strong>${assignedByName}</strong> has assigned you to the ${typeLabel.toLowerCase()} <strong>${assignmentName}</strong>.</p><p>Role: ${role}</p><p><a href="${dashboardUrl}">View My Assignments</a></p>`,
                status: "SENT",
                priority: "NORMAL",
                recipients: {
                    create: {
                        recipient_id: memberId,
                        recipient_type: "TO",
                        is_read: false
                    }
                }
            }
        });

        console.log(`[NOTIFICATION] Internal message created: ${message.id} for user ${memberId}`);

    } catch (error) {
        console.error(`[NOTIFICATION] Failed to create internal message for ${memberId}:`, error);
    }
}
