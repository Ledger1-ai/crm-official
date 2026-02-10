
import { SESv2, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { Agent } from "https";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

async function main() {
    console.log("Testing sending to VERIFIED sender (sales@basalthq.com)...");

    // Clean env
    delete process.env.AWS_PROFILE;
    delete process.env.AWS_ConfigFile;
    delete process.env.AWS_SHARED_CREDENTIALS_FILE;

    if (process.env.AWS_ACCESS_KEY_ID?.startsWith("AKIA")) {
        delete process.env.AWS_SESSION_TOKEN;
        delete process.env.AWS_SECURITY_TOKEN;
    }

    const credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID?.trim() || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY?.trim() || "",
    };

    const client = new SESv2({
        region: process.env.AWS_REGION?.trim(),
        credentials,
        requestHandler: new NodeHttpHandler({
            httpsAgent: new Agent({ rejectUnauthorized: false }),
        }),
    });

    const command = new SendEmailCommand({
        FromEmailAddress: process.env.EMAIL_FROM || "sales@basalthq.com",
        Destination: {
            // Sending TO the verified sender to confirm connectivity works
            ToAddresses: ["sales@basalthq.com"]
        },
        Content: {
            Simple: {
                Subject: { Data: "Self-Test: SES Connectivity Confirmed" },
                Body: { Text: { Data: "This email proves that the application can send emails via AWS SES. The previous error was due to the recipient (mmfmilton@icloud.com) not being verified in Sandbox mode." } }
            }
        }
    });

    try {
        const result = await client.send(command);
        console.log("Success! MessageId:", result.MessageId);
        console.log("The system is WORKING. You just need to verify the recipient.");
    } catch (e: any) {
        console.error("Failure:", e.message);
    }
}

main();
