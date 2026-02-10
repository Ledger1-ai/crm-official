
import { SESv2, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { Agent } from "https";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

async function main() {
    console.log("Testing Display Name Change...");

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

    const fromAddress = process.env.EMAIL_FROM || process.env.SES_FROM_ADDRESS || "sales@basalthq.com";
    console.log("Sending FROM:", fromAddress);

    const command = new SendEmailCommand({
        FromEmailAddress: fromAddress,
        Destination: {
            ToAddresses: ["sales@basalthq.com"] // Send to verified sender to test
        },
        Content: {
            Simple: {
                Subject: { Data: "Test: Display Name Verification" },
                Body: { Text: { Data: `This email should appear to be from "BasaltCRM". The From header used was: ${fromAddress}` } }
            }
        }
    });

    try {
        const result = await client.send(command);
        console.log("Success! MessageId:", result.MessageId);
        console.log("Display name update deployed.");
    } catch (e: any) {
        console.error("Failure:", e.message);
    }
}

main();
