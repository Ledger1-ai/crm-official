#!/usr/bin/env npx ts-node
/**
 * 10DLC Registration CLI Script
 * 
 * Usage:
 *   npx ts-node scripts/register-10dlc.ts [action] [options]
 * 
 * Actions:
 *   initiate          Start brand and campaign registration
 *   status            Check registration status
 *   list              List all registrations
 *   phones            List phone numbers
 *   request-phone     Request a new phone number
 * 
 * Examples:
 *   npx ts-node scripts/register-10dlc.ts initiate --ein=XX-XXXXXXX
 *   npx ts-node scripts/register-10dlc.ts status --id=reg-xxxxx
 *   npx ts-node scripts/register-10dlc.ts list
 *   npx ts-node scripts/register-10dlc.ts request-phone --campaign=reg-xxxxx
 */

import {
    initiate10DLCRegistration,
    listAllRegistrations,
    getRegistrationStatus,
    listPhoneNumbers,
    requestPhoneNumber,
    associatePhoneNumberWithCampaign,
    LEDGER1_BRAND_CONFIG,
    PORTAL_MESSAGE_CAMPAIGN_CONFIG,
} from "../lib/aws/eum-10dlc";

// Parse command line arguments
const args = process.argv.slice(2);
const action = args[0];

function parseArgs(args: string[]): Record<string, string> {
    const result: Record<string, string> = {};
    for (const arg of args) {
        if (arg.startsWith("--")) {
            const [key, value] = arg.slice(2).split("=");
            result[key] = value || "true";
        }
    }
    return result;
}

const options = parseArgs(args);

async function main() {
    console.log("╔════════════════════════════════════════════════════════════════╗");
    console.log("║           LEDGER1 CRM - 10DLC REGISTRATION                     ║");
    console.log("╚════════════════════════════════════════════════════════════════╝");
    console.log();

    if (!action || action === "help") {
        printHelp();
        return;
    }

    try {
        switch (action) {
            case "initiate":
                await handleInitiate(options);
                break;

            case "status":
                await handleStatus(options);
                break;

            case "list":
                await handleList();
                break;

            case "phones":
                await handlePhones();
                break;

            case "request-phone":
                await handleRequestPhone(options);
                break;

            case "associate":
                await handleAssociate(options);
                break;

            case "config":
                printConfig();
                break;

            default:
                console.error(`Unknown action: ${action}`);
                printHelp();
                process.exit(1);
        }
    } catch (err: any) {
        console.error("\n❌ Error:", err.message);
        if (err.message.includes("SDK not installed")) {
            console.error("\nInstall the SDK with:");
            console.error("  pnpm add @aws-sdk/client-pinpoint-sms-voice-v2");
        }
        process.exit(1);
    }
}

function printHelp() {
    console.log(`
Usage: npx ts-node scripts/register-10dlc.ts [action] [options]

Actions:
  initiate          Start brand and campaign registration
  status            Check registration status
  list              List all registrations
  phones            List phone numbers
  request-phone     Request a new phone number
  associate         Associate phone with campaign
  config            Show predefined configuration

Options:
  --ein=XX-XXXXXXX        EIN for brand registration (initiate)
  --id=reg-xxxxx          Registration ID (status)
  --campaign=reg-xxxxx    Campaign registration ID (request-phone, associate)
  --phone=pn-xxxxx        Phone number ID (associate)

Examples:
  npx ts-node scripts/register-10dlc.ts initiate --ein=85-1234567
  npx ts-node scripts/register-10dlc.ts status --id=reg-abc123
  npx ts-node scripts/register-10dlc.ts list
  npx ts-node scripts/register-10dlc.ts request-phone --campaign=reg-xyz789
  npx ts-node scripts/register-10dlc.ts associate --phone=pn-123 --campaign=reg-xyz

Environment Variables:
  AWS_REGION              AWS region (default: us-east-1)
  EUM_REGION              Override region for EUM service
  AWS_ACCESS_KEY_ID       AWS credentials
  AWS_SECRET_ACCESS_KEY   AWS credentials
`);
}

async function handleInitiate(opts: Record<string, string>) {
    console.log("📋 Starting 10DLC Registration Process...\n");

    const ein = opts.ein;
    if (!ein) {
        console.log("⚠️  No EIN provided. Will register as Sole Proprietor.");
        console.log("   For better throughput, provide EIN: --ein=XX-XXXXXXX\n");
    }

    console.log("Brand Configuration:");
    console.log("  Company:", LEDGER1_BRAND_CONFIG.companyName);
    console.log("  Website:", LEDGER1_BRAND_CONFIG.websiteUrl);
    console.log("  Vertical:", LEDGER1_BRAND_CONFIG.vertical);
    console.log("  Type:", LEDGER1_BRAND_CONFIG.companyType);
    console.log();

    console.log("Campaign Configuration:");
    console.log("  Use Case:", PORTAL_MESSAGE_CAMPAIGN_CONFIG.useCase);
    console.log("  Description:", PORTAL_MESSAGE_CAMPAIGN_CONFIG.campaignDescription.substring(0, 100) + "...");
    console.log();

    const result = await initiate10DLCRegistration(ein);

    console.log("✅ Registration Initiated!\n");
    console.log("Brand Registration ID:", result.brandRegistrationId);
    console.log("Campaign Registration ID:", result.campaignRegistrationId);
    console.log("Status:", result.status);
    console.log();
    console.log("📌 Next Steps:");
    result.nextSteps.forEach((step) => console.log("   " + step));
    console.log();
    console.log("📎 AWS Console Links:");
    console.log("   https://console.aws.amazon.com/pinpoint/home#/sms-account-settings/registrations");
}

async function handleStatus(opts: Record<string, string>) {
    const registrationId = opts.id;
    if (!registrationId) {
        console.error("❌ Registration ID required. Use --id=reg-xxxxx");
        process.exit(1);
    }

    console.log(`Checking status for: ${registrationId}\n`);

    const status = await getRegistrationStatus(registrationId);

    if (!status) {
        console.log("❌ Registration not found");
        return;
    }

    console.log("Registration Details:");
    console.log("  ID:", status.registrationId);
    console.log("  Type:", status.registrationType);
    console.log("  Status:", status.registrationStatus);
    console.log("  Version:", status.currentVersionNumber);
    if (status.approvedVersionNumber) {
        console.log("  Approved Version:", status.approvedVersionNumber);
    }
    if (status.latestDeniedVersionNumber) {
        console.log("  Denied Version:", status.latestDeniedVersionNumber);
    }
    console.log("  Created:", status.createdTimestamp);
}

async function handleList() {
    console.log("📋 Fetching all registrations...\n");

    const registrations = await listAllRegistrations();

    if (registrations.length === 0) {
        console.log("No registrations found.");
        return;
    }

    console.log(`Found ${registrations.length} registration(s):\n`);

    registrations.forEach((reg, i) => {
        const statusEmoji = reg.registrationStatus === "COMPLETE" ? "✅" :
            reg.registrationStatus === "DENIED" ? "❌" : "⏳";
        console.log(`${i + 1}. ${statusEmoji} ${reg.registrationType}`);
        console.log(`   ID: ${reg.registrationId}`);
        console.log(`   Status: ${reg.registrationStatus}`);
        console.log();
    });
}

async function handlePhones() {
    console.log("📱 Fetching phone numbers...\n");

    const phones = await listPhoneNumbers();

    if (phones.length === 0) {
        console.log("No phone numbers found.");
        console.log("\nTo request a phone number:");
        console.log("  npx ts-node scripts/register-10dlc.ts request-phone --campaign=reg-xxxxx");
        return;
    }

    console.log(`Found ${phones.length} phone number(s):\n`);

    phones.forEach((pn, i) => {
        const statusEmoji = pn.status === "ACTIVE" ? "✅" : "⏳";
        console.log(`${i + 1}. ${statusEmoji} ${pn.phoneNumber}`);
        console.log(`   ID: ${pn.phoneNumberId}`);
        console.log(`   Type: ${pn.numberType}`);
        console.log(`   Status: ${pn.status}`);
        console.log(`   Country: ${pn.isoCountryCode}`);
        console.log(`   Capabilities: ${pn.numberCapabilities.join(", ")}`);
        console.log();
    });
}

async function handleRequestPhone(opts: Record<string, string>) {
    const campaignId = opts.campaign;

    console.log("📱 Requesting new phone number...\n");

    if (!campaignId) {
        console.log("⚠️  No campaign ID provided. Phone will need manual association.");
        console.log("   For automatic association: --campaign=reg-xxxxx\n");
    }

    const phone = await requestPhoneNumber({
        isoCountryCode: "US",
        messageType: "TRANSACTIONAL",
        numberCapabilities: ["SMS"],
        numberType: "TEN_DLC",
        registrationId: campaignId,
    });

    if (!phone) {
        console.error("❌ Failed to request phone number");
        return;
    }

    console.log("✅ Phone Number Requested!\n");
    console.log("Phone Number:", phone.phoneNumber);
    console.log("Phone ID:", phone.phoneNumberId);
    console.log("Status:", phone.status);
    console.log("Type:", phone.numberType);
    console.log();
    console.log("💡 Add to your .env:");
    console.log(`   EUM_PHONE_NUMBER_ARN=${phone.phoneNumberArn}`);
}

async function handleAssociate(opts: Record<string, string>) {
    const phoneId = opts.phone;
    const campaignId = opts.campaign;

    if (!phoneId || !campaignId) {
        console.error("❌ Both --phone and --campaign are required");
        process.exit(1);
    }

    console.log(`Associating phone ${phoneId} with campaign ${campaignId}...\n`);

    const success = await associatePhoneNumberWithCampaign(phoneId, campaignId);

    if (success) {
        console.log("✅ Association successful!");
    } else {
        console.error("❌ Association failed");
    }
}

function printConfig() {
    console.log("📋 Predefined Configuration\n");

    console.log("=== BRAND CONFIGURATION ===");
    console.log(JSON.stringify(LEDGER1_BRAND_CONFIG, null, 2));

    console.log("\n=== CAMPAIGN CONFIGURATION ===");
    console.log(JSON.stringify(PORTAL_MESSAGE_CAMPAIGN_CONFIG, null, 2));
}

// Run
main().catch(console.error);
