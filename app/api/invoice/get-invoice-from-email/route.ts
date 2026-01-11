import { NextResponse } from "next/server";
import Imap from "imap";
import { simpleParser, ParsedMail } from "mailparser";
import { Readable } from "stream";
import axios from "axios";
// TLS workaround: disable certificate verification to avoid DEPTH_ZERO_SELF_SIGNED_CERT
// WARNING: Do not leave this enabled in production without proper CA configuration.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const imapConfig: Imap.Config = {
  user: process.env.IMAP_USER!,
  password: process.env.IMAP_PASSWORD!,
  host: process.env.IMAP_HOST,
  port: parseInt(process.env.IMAP_PORT ?? "993"),
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
};

export async function GET() {
  try {
    console.log("Starting email check...");
    if (!imapConfig.user || !imapConfig.password || !imapConfig.host) {
      console.warn("IMAP configuration missing. Skipping email check.");
      return NextResponse.json({ message: "IMAP not configured. Skipped." }, { status: 200 });
    }
    const imap = new Imap(imapConfig);
    const emailsProcessed = await checkEmail(imap);
    console.log(`Email check completed. Processed ${emailsProcessed} emails.`);

    return NextResponse.json(
      {
        message: `Email check completed. Processed ${emailsProcessed} emails.`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in GET function:", error);
    const debug = process.env.NODE_ENV !== "production";
    const payload = debug
      ? {
        error: "Internal Server Error",
        message: error?.message,
        code: error?.code,
        name: error?.name,
        stack: error?.stack,
      }
      : { error: "Internal Server Error" };

    // Return 200 even on error to prevent client-side crash, but include error info
    return NextResponse.json({ ...payload, success: false }, { status: 200 });
  }
}

async function checkEmail(imap: Imap): Promise<number> {
  return new Promise((resolve, reject) => {
    let emailsProcessed = 0;

    imap.once("ready", () => {
      console.log("IMAP connection ready");
      imap.openBox("INBOX", false, (err, box) => {
        if (err) {
          console.error("Error opening inbox:", err);
          reject(err);
          return;
        }
        console.log("Inbox opened");

        imap.search(["UNSEEN"], (err, results) => {
          if (err) {
            console.error("Error searching for unseen emails:", err);
            reject(err);
            return;
          }
          console.log(`Found ${results.length} unseen emails`);

          if (results.length === 0) {
            imap.end();
            resolve(0);
            return;
          }

          const fetch = imap.fetch(results, { bodies: [""], markSeen: true });

          fetch.on("message", (msg) => {
            console.log("Processing new message");
            let fullMessage = "";

            msg.on("body", (stream) => {
              stream.on("data", (chunk) => {
                fullMessage += chunk.toString("utf8");
              });

              stream.once("end", () => {
                simpleParser(fullMessage, async (err, parsed) => {
                  if (err) {
                    console.error("Error parsing email:", err);
                    return;
                  }
                  console.log("Parsed email:", parsed);
                  const attachments = getAttachments(parsed);
                  console.log(`Found ${attachments.length} attachments`);

                  for (const attachment of attachments) {
                    try {
                      await sendAttachmentToAPI(attachment);
                      emailsProcessed++;
                      console.log(`Processed attachment ${emailsProcessed}`);
                    } catch (error: any) {
                      console.error(
                        "Error sending attachment to Upload API:",
                        error.message
                      );
                    }
                  }
                });
              });
            });
          });

          fetch.once("error", (err) => {
            console.error("Fetch error:", err);
            reject(err);
          });

          fetch.once("end", () => {
            console.log("Finished processing all messages");
            imap.end();
            resolve(emailsProcessed);
          });
        });
      });
    });

    imap.once("error", (err: any) => {
      console.error("IMAP connection error:", err);
      reject(err);
    });

    imap.connect();
  });
}

function getAttachments(parsed: ParsedMail): any[] {
  let attachments = parsed.attachments;

  // Log attachment info
  attachments.forEach((attachment, index) => {
    console.log(`Attachment ${index + 1}:`, {
      filename: attachment.filename,
      contentType: attachment.contentType,
      size: attachment.size,
      contentDisposition: attachment.contentDisposition,
    });
  });

  return attachments;
}

async function sendAttachmentToAPI(attachment: any) {
  try {
    console.log("Sending attachment to API:", attachment.filename);
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await axios.post(
      `${baseUrl}/api/upload/cron`,
      { file: attachment },
      { headers: { "Content-Type": "application/json" } }
    );
    console.log("Upload API response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error in sendAttachmentToAPI:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }
    throw error;
  }
}
