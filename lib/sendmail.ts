import nodemailer from "nodemailer";
import { SESv2, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { Agent } from "https";


interface EmailOptions {
  from?: string;
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

export default async function sendEmail(
  emailOptions: EmailOptions
): Promise<void> {

  let transporter;

  // Prefer AWS SES if configured
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_REGION) {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const sessionToken = process.env.AWS_SESSION_TOKEN;

    // If using permanent credentials (AKIA...), ensure no stale session token is used
    const credentials = {
      accessKeyId,
      secretAccessKey,
      sessionToken: accessKeyId?.startsWith('AKIA') ? undefined : sessionToken
    };

    const ses = new SESv2({
      region: process.env.AWS_REGION,
      credentials,
      requestHandler: new NodeHttpHandler({
        httpsAgent: new Agent({ rejectUnauthorized: false }),
      }),
    });

    transporter = nodemailer.createTransport({
      SES: { sesClient: ses, SendEmailCommand },
    } as any);
  } else {
    // Fallback to SMTP (Resend, etc.)
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  try {
    const result = await transporter.sendMail({
      ...emailOptions,
      from: emailOptions.from || process.env.SES_FROM_ADDRESS || process.env.EMAIL_FROM
    });
    console.log(`[Email Success] To: ${emailOptions.to}, MessageId: ${result.messageId}`);
  } catch (error: any | Error) {
    console.error(`[Email Error] Failed to send to ${emailOptions.to}:`, error);
    throw error; // Rethrow to let the API know it failed
  }
}
