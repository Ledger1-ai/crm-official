
import { SESv2, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { Agent } from "https";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

async function main() {
    console.log("Testing sending to mmfmilton@icloud.com...");

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
            ToAddresses: ["mmfmilton@icloud.com"]
        },
        Content: {
            Simple: {
                Subject: { Data: "Test: SES Email to mmfmilton" },
                Body: { Text: { Data: "If you receive this, the email verification was successful, and you can now receive emails from the system while in Sandbox mode." } }
            }
        }
    });

    try {
        const result = await client.send(command);
        console.log("Success! MessageId:", result.MessageId);
        console.log("Email successfully sent to mmfmilton@icloud.com.");
    } catch (e: any) {
        console.error("Failure:", e.message);
        if (e.message.includes("Email address is not verified")) {
            console.log("\nDIAGNOSIS: The email 'mmfmilton@icloud.com' is still NOT verified in AWS SES.");
            console.log("You must go to AWS Console -> SES -> Identities -> Create Identity -> Email Address -> Enter 'mmfmilton@icloud.com' -> Click Create.");
            console.log("Then check the inbox for mmfmilton@icloud.com and click the verification link.");
        }
    }
}

main();
