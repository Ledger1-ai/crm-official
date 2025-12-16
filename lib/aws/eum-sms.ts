/**
 * Dynamic import to avoid TypeScript resolution issues if the SDK is not installed.
 * AWS End User Messaging (SMS & Voice v2) client will be required at runtime.
 */
let PinpointSMSVoiceV2Client: any;
let SendTextMessageCommand: any;
function ensureEumSdk() {
    if (!PinpointSMSVoiceV2Client || !SendTextMessageCommand) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const pkg = require("@aws-sdk/client-pinpoint-sms-voice-v2");
            PinpointSMSVoiceV2Client = pkg.PinpointSMSVoiceV2Client;
            SendTextMessageCommand = pkg.SendTextMessageCommand;
        } catch (e) {
            throw new Error("AWS End User Messaging SMS SDK not installed: @aws-sdk/client-pinpoint-sms-voice-v2");
        }
    }
}

export type SendSmsEUMOptions = {
    to: string; // E.164, e.g. +15551234567
    body: string;
    senderId?: string; // alpha-only, region/country dependent
    originationIdentityArn?: string; // ARN of phone number/short code/sender id (optional when senderId is provided)
    messageType?: "PROMOTIONAL" | "TRANSACTIONAL";
    region?: string; // defaults to AWS_REGION if not provided
};

function getEnv(name: string, required = false): string | undefined {
    const v = process.env[name];
    if (required && (!v || !String(v).trim())) {
        throw new Error(`Missing required env var: ${name}`);
    }
    return v?.trim();
}

let _client: any | null = null;
function client(region?: string): any {
    if (_client) return _client;
    const resolvedRegion = region || getEnv("EUM_REGION") || getEnv("PINPOINT_REGION") || getEnv("AWS_REGION") || "us-east-1";
    ensureEumSdk();
    _client = new PinpointSMSVoiceV2Client({ region: resolvedRegion });
    return _client;
}

/**
 * Send SMS using AWS End User Messaging (Pinpoint SMS and Voice v2).
 * Prefers SenderId when provided; otherwise can use OriginationIdentity ARN.
 */
export async function sendSmsEUM(opts: SendSmsEUMOptions): Promise<{ messageId?: string }> {
    const to = (opts.to || "").trim();
    if (!to) throw new Error("Destination phone number is required (E.164)");

    const messageBody = opts.body || "";
    const messageType: "PROMOTIONAL" | "TRANSACTIONAL" = opts.messageType || "TRANSACTIONAL";

    ensureEumSdk();
    const cmd = new SendTextMessageCommand({
        DestinationPhoneNumber: to,
        MessageBody: messageBody,
        MessageType: messageType,
        ...(opts.senderId ? { SenderId: opts.senderId } : {}),
        ...(opts.originationIdentityArn ? { OriginationIdentity: opts.originationIdentityArn } : {}),
    });

    try {
        const res = await client(opts.region).send(cmd);
        return { messageId: (res as any)?.MessageId };
    } catch (err: any) {
        const msg = err?.message || String(err);
        // Extract Pinpoint SMS v2 Reason code if present (e.g., DESTINATION_PHONE_NUMBER_NOT_VERIFIED)
        let reasonCode: string | undefined;
        const m = msg.match(/Reason="([^"]+)"/);
        if (m) {
            reasonCode = m[1];
        }
        // Surface a concise error code when available to allow upstream routing/handling
        throw new Error(`[EUM_SMS_FAILED] ${reasonCode ?? msg}`);
    }
}

/**
 * Send a portal notification SMS using the 10DLC-registered phone number
 * This is specifically for "You have a new message" notifications with portal links
 * 
 * Uses environment variables:
 * - EUM_PORTAL_PHONE_ARN: The ARN of the 10DLC registered phone number
 * - EUM_REGION: AWS region (defaults to us-east-1)
 */
export async function sendPortalNotificationSms(
    to: string,
    message: string
): Promise<{ messageId?: string }> {
    const portalPhoneArn = getEnv("EUM_PORTAL_PHONE_ARN");

    if (!portalPhoneArn) {
        console.warn("[Portal SMS] EUM_PORTAL_PHONE_ARN not configured - SMS will not be sent");
        return { messageId: undefined };
    }

    return sendSmsEUM({
        to,
        body: message,
        originationIdentityArn: portalPhoneArn,
        messageType: "TRANSACTIONAL",
    });
}
