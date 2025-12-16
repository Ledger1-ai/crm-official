/**
 * AWS End User Messaging - 10DLC Brand and Campaign Registration
 * Uses @aws-sdk/client-pinpoint-sms-voice-v2 for 10DLC compliance
 * 
 * 10DLC Requirements:
 * 1. Register Brand (Company info)
 * 2. Register Campaign (Use case description)
 * 3. Associate phone number with campaign
 */

// Lazy-load SDK to avoid build issues if not installed
let PinpointSMSVoiceV2Client: any;
let CreateRegistrationCommand: any;
let SubmitRegistrationVersionCommand: any;
let DescribeRegistrationsCommand: any;
let ListRegistrationAssociationsCommand: any;
let CreateRegistrationAssociationCommand: any;
let DeleteRegistrationCommand: any;
let RequestPhoneNumberCommand: any;
let DescribePhoneNumbersCommand: any;

function ensureEumSdk() {
    if (!PinpointSMSVoiceV2Client) {
        try {
            const pkg = require("@aws-sdk/client-pinpoint-sms-voice-v2");
            PinpointSMSVoiceV2Client = pkg.PinpointSMSVoiceV2Client;
            CreateRegistrationCommand = pkg.CreateRegistrationCommand;
            SubmitRegistrationVersionCommand = pkg.SubmitRegistrationVersionCommand;
            DescribeRegistrationsCommand = pkg.DescribeRegistrationsCommand;
            ListRegistrationAssociationsCommand = pkg.ListRegistrationAssociationsCommand;
            CreateRegistrationAssociationCommand = pkg.CreateRegistrationAssociationCommand;
            DeleteRegistrationCommand = pkg.DeleteRegistrationCommand;
            RequestPhoneNumberCommand = pkg.RequestPhoneNumberCommand;
            DescribePhoneNumbersCommand = pkg.DescribePhoneNumbersCommand;
        } catch (e) {
            throw new Error("AWS End User Messaging SDK not installed: @aws-sdk/client-pinpoint-sms-voice-v2");
        }
    }
}

// Singleton client
let _client: any = null;
function getClient(region?: string): any {
    if (_client) return _client;
    const resolvedRegion = region || process.env.EUM_REGION || process.env.AWS_REGION || "us-east-1";
    ensureEumSdk();
    _client = new PinpointSMSVoiceV2Client({ region: resolvedRegion });
    return _client;
}

// ============================================================================
// 10DLC BRAND REGISTRATION
// ============================================================================

export interface BrandRegistrationInput {
    companyName: string;
    ein?: string; // Tax ID (optional for Sole Proprietor)
    vertical: "AGRICULTURE" | "AUTOMOTIVE" | "BANKING" | "CONSTRUCTION" | "CONSUMER" | "EDUCATION" | "ENERGY" | "ENGINEERING" | "ENTERTAINMENT" | "FINANCIAL" | "GAMING" | "GOVERNMENT" | "HEALTHCARE" | "HOSPITALITY" | "INSURANCE" | "LEGAL" | "MANUFACTURING" | "MEDIA" | "NGO" | "POLITICAL" | "REAL_ESTATE" | "RELIGIOUS" | "RETAIL" | "TECHNOLOGY" | "TELECOM" | "TRANSPORTATION" | "TRAVEL" | string;
    companyType: "PRIVATE_PROFIT" | "PUBLIC_PROFIT" | "NON_PROFIT" | "GOVERNMENT" | "SOLE_PROPRIETOR";
    websiteUrl: string;
    stockSymbol?: string;
    stockExchange?: "NASDAQ" | "NYSE" | "AMEX" | "AMX" | "ASX" | "B3" | "BME" | "BSE" | "FRA" | "ICEX" | "JPX" | "JSE" | "KRX" | "LON" | "NSE" | "OMX" | "SEHK" | "SGX" | "SSE" | "STO" | "SWX" | "SZSE" | "TSX" | "TWSE" | "VSE" | "OTHER" | "NONE";
    address: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        countryCode: string; // ISO 3166-1 alpha-2, e.g., "US"
    };
    contactEmail: string;
    contactPhone: string; // E.164 format
    supportEmail?: string;
    supportPhone?: string;
}

export async function registerBrand(input: BrandRegistrationInput): Promise<{
    registrationId: string;
    registrationArn: string;
    registrationStatus: string;
}> {
    ensureEumSdk();
    const client = getClient();

    // Create a 10DLC brand registration
    const createCmd = new CreateRegistrationCommand({
        RegistrationType: "TEN_DLC_BRAND",
        Tags: [
            { Key: "Application", Value: "Ledger1CRM" },
            { Key: "CreatedBy", Value: "10DLC-Registration" },
        ],
    });

    const createRes = await client.send(createCmd);
    const registrationId = createRes.RegistrationId;
    const registrationArn = createRes.RegistrationArn;

    console.log(`[10DLC] Brand registration created: ${registrationId}`);

    // The brand registration requires submitting field values
    // This is done through the AWS Console or separate API calls
    // Here we return the registration ID for manual completion

    return {
        registrationId,
        registrationArn,
        registrationStatus: createRes.RegistrationStatus || "CREATED",
    };
}

// ============================================================================
// 10DLC CAMPAIGN REGISTRATION
// ============================================================================

export interface CampaignRegistrationInput {
    brandRegistrationId: string; // Must have approved brand first
    useCase:
    | "TWO_FACTOR_AUTHENTICATION"
    | "ACCOUNT_NOTIFICATION"
    | "CUSTOMER_CARE"
    | "DELIVERY_NOTIFICATION"
    | "FRAUD_ALERT"
    | "HIGHER_EDUCATION"
    | "LOW_VOLUME"
    | "MARKETING"
    | "MIXED"
    | "POLLING_AND_VOTING"
    | "PUBLIC_SERVICE_ANNOUNCEMENT"
    | "SECURITY_ALERT"
    | "SOCIAL"
    | "SWEEPSTAKE"
    | string;
    campaignDescription: string;
    messageFlow: string; // Describe how users opt-in
    sampleMessages: string[]; // 1-5 sample messages
    helpMessage: string; // Response to HELP
    optOutMessage: string; // Response to STOP/UNSUBSCRIBE
    optInKeywords?: string[]; // e.g., ["START", "YES", "SUBSCRIBE"]
    optOutKeywords?: string[]; // e.g., ["STOP", "UNSUBSCRIBE", "QUIT"]
    helpKeywords?: string[]; // e.g., ["HELP", "INFO"]
    subscriberOptIn: boolean; // Whether subscribers have opted in
    subscriberOptOut: boolean; // Whether opt-out is supported
    embeddedLink: boolean; // Whether messages contain links
    embeddedPhone: boolean; // Whether messages contain phone numbers
    numberPooling: boolean; // Whether using multiple numbers
    directLending: boolean; // Loan/lending related messages
    ageGated: boolean; // Age-restricted content
}

export async function registerCampaign(input: CampaignRegistrationInput): Promise<{
    registrationId: string;
    registrationArn: string;
    registrationStatus: string;
}> {
    ensureEumSdk();
    const client = getClient();

    // Create a 10DLC campaign registration
    const createCmd = new CreateRegistrationCommand({
        RegistrationType: "TEN_DLC_CAMPAIGN",
        Tags: [
            { Key: "Application", Value: "Ledger1CRM" },
            { Key: "UseCase", Value: input.useCase },
            { Key: "BrandRegistrationId", Value: input.brandRegistrationId },
        ],
    });

    const createRes = await client.send(createCmd);
    const registrationId = createRes.RegistrationId;
    const registrationArn = createRes.RegistrationArn;

    console.log(`[10DLC] Campaign registration created: ${registrationId}`);

    // Campaign details are submitted through the registration form
    // The registration ID is returned for status tracking

    return {
        registrationId,
        registrationArn,
        registrationStatus: createRes.RegistrationStatus || "CREATED",
    };
}

// ============================================================================
// REGISTRATION STATUS & MANAGEMENT
// ============================================================================

export interface RegistrationInfo {
    registrationId: string;
    registrationArn: string;
    registrationType: string;
    registrationStatus: string;
    currentVersionNumber: number;
    approvedVersionNumber?: number;
    latestDeniedVersionNumber?: number;
    additionalAttributes?: Record<string, string>;
    createdTimestamp?: Date;
}

export async function getRegistrationStatus(registrationId: string): Promise<RegistrationInfo | null> {
    ensureEumSdk();
    const client = getClient();

    try {
        const cmd = new DescribeRegistrationsCommand({
            RegistrationIds: [registrationId],
        });
        const res = await client.send(cmd);

        if (!res.Registrations || res.Registrations.length === 0) {
            return null;
        }

        const reg = res.Registrations[0];
        return {
            registrationId: reg.RegistrationId,
            registrationArn: reg.RegistrationArn,
            registrationType: reg.RegistrationType,
            registrationStatus: reg.RegistrationStatus,
            currentVersionNumber: reg.CurrentVersionNumber,
            approvedVersionNumber: reg.ApprovedVersionNumber,
            latestDeniedVersionNumber: reg.LatestDeniedVersionNumber,
            additionalAttributes: reg.AdditionalAttributes,
            createdTimestamp: reg.CreatedTimestamp,
        };
    } catch (err: any) {
        console.error(`[10DLC] Failed to get registration status: ${err.message}`);
        return null;
    }
}

export async function listAllRegistrations(): Promise<RegistrationInfo[]> {
    ensureEumSdk();
    const client = getClient();

    try {
        const cmd = new DescribeRegistrationsCommand({});
        const res = await client.send(cmd);

        return (res.Registrations || []).map((reg: any) => ({
            registrationId: reg.RegistrationId,
            registrationArn: reg.RegistrationArn,
            registrationType: reg.RegistrationType,
            registrationStatus: reg.RegistrationStatus,
            currentVersionNumber: reg.CurrentVersionNumber,
            approvedVersionNumber: reg.ApprovedVersionNumber,
            latestDeniedVersionNumber: reg.LatestDeniedVersionNumber,
            additionalAttributes: reg.AdditionalAttributes,
            createdTimestamp: reg.CreatedTimestamp,
        }));
    } catch (err: any) {
        console.error(`[10DLC] Failed to list registrations: ${err.message}`);
        return [];
    }
}

// ============================================================================
// PHONE NUMBER MANAGEMENT
// ============================================================================

export interface PhoneNumberInfo {
    phoneNumber: string;
    phoneNumberArn: string;
    phoneNumberId: string;
    status: string;
    isoCountryCode: string;
    messageType: string;
    numberCapabilities: string[];
    numberType: string;
    monthlyLeasingPrice: string;
    twoWayEnabled: boolean;
    selfManagedOptOutsEnabled: boolean;
    optOutListName: string;
    createdTimestamp?: Date;
}

export async function listPhoneNumbers(): Promise<PhoneNumberInfo[]> {
    ensureEumSdk();
    const client = getClient();

    try {
        const cmd = new DescribePhoneNumbersCommand({});
        const res = await client.send(cmd);

        return (res.PhoneNumbers || []).map((pn: any) => ({
            phoneNumber: pn.PhoneNumber,
            phoneNumberArn: pn.PhoneNumberArn,
            phoneNumberId: pn.PhoneNumberId,
            status: pn.Status,
            isoCountryCode: pn.IsoCountryCode,
            messageType: pn.MessageType,
            numberCapabilities: pn.NumberCapabilities || [],
            numberType: pn.NumberType,
            monthlyLeasingPrice: pn.MonthlyLeasingPrice,
            twoWayEnabled: pn.TwoWayEnabled,
            selfManagedOptOutsEnabled: pn.SelfManagedOptOutsEnabled,
            optOutListName: pn.OptOutListName,
            createdTimestamp: pn.CreatedTimestamp,
        }));
    } catch (err: any) {
        console.error(`[10DLC] Failed to list phone numbers: ${err.message}`);
        return [];
    }
}

export async function requestPhoneNumber(options: {
    isoCountryCode: string;
    messageType: "PROMOTIONAL" | "TRANSACTIONAL";
    numberCapabilities: ("SMS" | "VOICE" | "MMS")[];
    numberType: "LONG_CODE" | "TOLL_FREE" | "TEN_DLC";
    registrationId?: string; // 10DLC campaign registration ID
}): Promise<PhoneNumberInfo | null> {
    ensureEumSdk();
    const client = getClient();

    try {
        const cmd = new RequestPhoneNumberCommand({
            IsoCountryCode: options.isoCountryCode,
            MessageType: options.messageType,
            NumberCapabilities: options.numberCapabilities,
            NumberType: options.numberType,
            RegistrationId: options.registrationId,
            Tags: [
                { Key: "Application", Value: "Ledger1CRM" },
                { Key: "CreatedBy", Value: "10DLC-Registration" },
            ],
        });

        const res = await client.send(cmd);

        return {
            phoneNumber: res.PhoneNumber,
            phoneNumberArn: res.PhoneNumberArn,
            phoneNumberId: res.PhoneNumberId,
            status: res.Status,
            isoCountryCode: res.IsoCountryCode,
            messageType: res.MessageType,
            numberCapabilities: res.NumberCapabilities || [],
            numberType: res.NumberType,
            monthlyLeasingPrice: res.MonthlyLeasingPrice,
            twoWayEnabled: res.TwoWayEnabled,
            selfManagedOptOutsEnabled: res.SelfManagedOptOutsEnabled,
            optOutListName: res.OptOutListName,
            createdTimestamp: res.CreatedTimestamp,
        };
    } catch (err: any) {
        console.error(`[10DLC] Failed to request phone number: ${err.message}`);
        return null;
    }
}

// ============================================================================
// ASSOCIATION MANAGEMENT
// ============================================================================

export async function associatePhoneNumberWithCampaign(
    phoneNumberId: string,
    campaignRegistrationId: string
): Promise<boolean> {
    ensureEumSdk();
    const client = getClient();

    try {
        const cmd = new CreateRegistrationAssociationCommand({
            RegistrationId: campaignRegistrationId,
            ResourceId: phoneNumberId,
        });

        await client.send(cmd);
        console.log(`[10DLC] Associated phone ${phoneNumberId} with campaign ${campaignRegistrationId}`);
        return true;
    } catch (err: any) {
        console.error(`[10DLC] Failed to associate phone number: ${err.message}`);
        return false;
    }
}

// ============================================================================
// PORTAL MESSAGE CAMPAIGN - PREDEFINED CONFIGURATION
// ============================================================================

/**
 * Ledger1 CRM Portal Message Campaign
 * This is the standard campaign configuration for portal message notifications
 */
export const PORTAL_MESSAGE_CAMPAIGN_CONFIG: Omit<CampaignRegistrationInput, "brandRegistrationId"> = {
    useCase: "ACCOUNT_NOTIFICATION",
    campaignDescription:
        "Ledger1 CRM Message Portal Notifications. " +
        "When users send outreach messages to business contacts, " +
        "the recipient receives an SMS notification with a secure link " +
        "to view the full message in a web portal. " +
        "This is used for B2B sales outreach and investor communications.",
    messageFlow:
        "Recipients opt-in when they are added as a lead/contact in Ledger1 CRM. " +
        "Business users initiate outreach through the CRM's Push to Outreach feature. " +
        "Recipients can opt-out at any time by replying STOP or clicking unsubscribe in the portal.",
    sampleMessages: [
        "You have a new message from {SenderName} at {Company}. View it here: {PortalLink}. Reply STOP to unsubscribe.",
        "{RecipientName}, there's a message waiting for you in your secure portal: {PortalLink}. Reply STOP to opt out.",
        "New business communication from {Company}. Read the full message: {PortalLink}. Text STOP to unsubscribe.",
    ],
    helpMessage:
        "Ledger1 CRM Message Portal: You're receiving notifications about secure business messages. " +
        "Reply STOP to opt out. Contact support@ledger1.ai for help.",
    optOutMessage:
        "You've been unsubscribed from Ledger1 message notifications. " +
        "You will no longer receive SMS alerts. Reply START to re-subscribe.",
    optInKeywords: ["START", "YES", "SUBSCRIBE", "OPTIN"],
    optOutKeywords: ["STOP", "UNSUBSCRIBE", "QUIT", "CANCEL", "END", "OPTOUT"],
    helpKeywords: ["HELP", "INFO"],
    subscriberOptIn: true,
    subscriberOptOut: true,
    embeddedLink: true,
    embeddedPhone: false,
    numberPooling: false,
    directLending: false,
    ageGated: false,
};

/**
 * Ledger1 CRM Brand Configuration
 */
export const LEDGER1_BRAND_CONFIG: Omit<BrandRegistrationInput, "ein"> = {
    companyName: "The Utility Company LLC",
    vertical: "TECHNOLOGY",
    companyType: "PRIVATE_PROFIT",
    websiteUrl: "https://ledger1.ai",
    address: {
        street: "1005 Wellesley Dr. SE",
        city: "Albuquerque",
        state: "NM",
        postalCode: "87106",
        countryCode: "US",
    },
    contactEmail: "founders@theutilitycompany.co",
    contactPhone: "+15059999999", // Replace with actual number
    supportEmail: "support@ledger1.ai",
};

// Export a convenience function to start the full registration process
export async function initiate10DLCRegistration(ein?: string): Promise<{
    brandRegistrationId: string;
    campaignRegistrationId: string;
    status: string;
    nextSteps: string[];
}> {
    // Step 1: Register brand
    const brandConfig: BrandRegistrationInput = {
        ...LEDGER1_BRAND_CONFIG,
        ein,
    };

    console.log("[10DLC] Starting brand registration...");
    const brandResult = await registerBrand(brandConfig);

    // Step 2: Register campaign (linked to brand)
    console.log("[10DLC] Starting campaign registration...");
    const campaignConfig: CampaignRegistrationInput = {
        brandRegistrationId: brandResult.registrationId,
        ...PORTAL_MESSAGE_CAMPAIGN_CONFIG,
    };

    const campaignResult = await registerCampaign(campaignConfig);

    return {
        brandRegistrationId: brandResult.registrationId,
        campaignRegistrationId: campaignResult.registrationId,
        status: "INITIATED",
        nextSteps: [
            "1. Complete brand registration form in AWS Console",
            "2. Wait for brand approval (1-7 business days)",
            "3. Complete campaign registration form in AWS Console",
            "4. Wait for campaign approval (1-7 business days)",
            "5. Request 10DLC phone number associated with campaign",
            "6. Update environment variables with phone number ARN",
        ],
    };
}
