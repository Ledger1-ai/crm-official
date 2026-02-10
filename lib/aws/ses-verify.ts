import { SESv2Client, CreateEmailIdentityCommand, GetEmailIdentityCommand, DeleteEmailIdentityCommand } from "@aws-sdk/client-sesv2";

interface SESCredentials {
    accessKeyId: string;
    secretAccessKey: string;
    region?: string;
}

const getClient = (creds?: SESCredentials) => {
    if (creds?.accessKeyId && creds?.secretAccessKey) {
        return new SESv2Client({
            region: creds.region || "us-east-1",
            credentials: {
                accessKeyId: creds.accessKeyId,
                secretAccessKey: creds.secretAccessKey,
            }
        });
    }
    // Fallback to system env
    return new SESv2Client({ region: process.env.SES_REGION || process.env.AWS_REGION || "us-east-1" });
}

export type VerificationStatus = "PENDING" | "SUCCESS" | "FAILED" | "NOT_STARTED";

/**
 * Triggers a verification email to be sent to the specified address.
 * AWS SES will send a link that the user must click.
 */
export async function verifyEmailIdentity(email: string, creds?: SESCredentials): Promise<boolean> {
    const client = getClient(creds);
    try {
        const command = new CreateEmailIdentityCommand({
            EmailIdentity: email,
        });
        await client.send(command);
        return true;
    } catch (error: any) {
        console.error("[SES_VERIFY_INIT]", error);
        // If already exists, we might get a conflict, which is fine, we just want to ensure it's there.
        if (error.name === "AlreadyExistsException") {
            return true;
        }
        throw new Error(`Failed to initiate verification: ${error.message}`);
    }
}

/**
 * Checks the current verification status of an email identity.
 */
export async function getIdentityVerificationStatus(email: string, creds?: SESCredentials): Promise<VerificationStatus> {
    const client = getClient(creds);
    try {
        const command = new GetEmailIdentityCommand({
            EmailIdentity: email,
        });
        const response = await client.send(command);

        // SESv2 returns VerifiedForSendingStatus: boolean
        if (response.VerifiedForSendingStatus) {
            return "SUCCESS";
        }
        return "PENDING";
    } catch (error: any) {
        if (error.name === "NotFoundException") {
            return "NOT_STARTED";
        }
        console.error("[SES_VERIFY_CHECK]", error);
        return "FAILED";
    }
}

/**
 * Remove an identity (stopped verifying or deleted config)
 */
export async function deleteEmailIdentity(email: string, creds?: SESCredentials) {
    const client = getClient(creds);
    try {
        const command = new DeleteEmailIdentityCommand({
            EmailIdentity: email
        });
        await client.send(command);
    } catch {
        // Ignore if not found
    }
}
