import { prismadb } from "@/lib/prisma";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { Resend } from "resend";
import sendSystemEmail from "@/lib/sendmail";
import nodemailer from "nodemailer";
import * as aws from "@aws-sdk/client-ses";

interface EmailOptions {
    from?: string; // Optional override, otherwise uses config.from_email
    to: string;
    subject: string;
    text: string;
    html?: string;
    attachments?: {
        filename: string;
        content: any;
        contentType?: string;
    }[];
}

export async function sendTeamEmail(teamId: string, options: EmailOptions) {
    // 1. Fetch Config
    const config = await prismadb.teamEmailConfig.findUnique({ where: { team_id: teamId } });

    // 2. Fallback if not configured or verified
    // We strictly require VERIFIED status to avoid sending from unverified domains/emails and getting blocked
    if (!config || config.verification_status !== "VERIFIED") {
        console.log(`[TeamEmail] Falling back to system email for team ${teamId} (Reason: ${!config ? "No Config" : "Not Verified"})`);
        return sendSystemEmail(options);
    }

    const fromAddress = `"${config.from_name || config.from_email}" <${config.from_email}>`;

    // 3. AWS SES
    if (config.provider === "AWS_SES") {
        if (!config.aws_access_key_id || !config.aws_secret_access_key) {
            console.error("[TeamEmail] Missing AWS Credentials");
            return sendSystemEmail(options);
        }

        const ses = new aws.SES({
            apiVersion: "2010-12-01",
            region: config.aws_region || "us-east-1",
            credentials: {
                accessKeyId: config.aws_access_key_id,
                secretAccessKey: config.aws_secret_access_key,
            }
        });

        const transporter = nodemailer.createTransport({
            SES: { ses, aws },
        } as any);

        try {
            await transporter.sendMail({
                from: options.from || fromAddress,
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
                attachments: options.attachments,
            });
            console.log(`[TeamEmail] Sent via AWS SES (Team: ${teamId})`);
            return;
        } catch (error) {
            console.error("[TeamEmail] AWS SES Send Failed:", error);
            throw error;
        }
    }

    // 4. RESEND
    if (config.provider === "RESEND") {
        if (!config.resend_api_key) {
            console.error("[TeamEmail] Missing Resend API Key");
            return sendSystemEmail(options);
        }

        const resend = new Resend(config.resend_api_key);

        try {
            const { data, error } = await resend.emails.send({
                from: options.from || fromAddress,
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
                attachments: options.attachments?.map(a => ({
                    filename: a.filename,
                    content: a.content, // Resend expects buffer or string
                })),
            });

            if (error) {
                console.error("[TeamEmail] Resend API Error:", error);
                throw new Error(error.message);
            }

            console.log(`[TeamEmail] Sent via Resend (Team: ${teamId}, ID: ${data?.id})`);
            return;
        } catch (error) {
            console.error("[TeamEmail] Resend Send Failed:", error);
            throw error;
        }
    }

    // Fallback if provider unknown
    return sendSystemEmail(options);
}
