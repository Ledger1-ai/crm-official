/**
 * Script to assign existing 10DLC registration to Ledger1 - Internal Team
 * 
 * Run with: npx tsx scripts/assign-10dlc-to-ledger1.ts
 * 
 * Registration IDs from AWS EUM:
 * - Brand: registration-0a3d07d1a93a46faa6c3d75565ab65b2 (APPROVED)
 * - Campaign: registration-6178e13852b14a779d6d4b0c49d15f36 (SUBMITTED - pending approval)
 */

import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local and .env
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Ledger1 - Internal Team ID
const LEDGER1_TEAM_ID = "6934998c7038863976a7a5fd";

// Registration IDs from AWS
const BRAND_REGISTRATION_ID = "registration-0a3d07d1a93a46faa6c3d75565ab65b2";
const CAMPAIGN_REGISTRATION_ID = "registration-6178e13852b14a779d6d4b0c49d15f36";

async function main() {
    console.log("[10DLC Assignment] Starting...");

    // Check if team exists
    const team = await prisma.team.findUnique({
        where: { id: LEDGER1_TEAM_ID },
    });

    if (!team) {
        console.error(`[10DLC Assignment] Team ${LEDGER1_TEAM_ID} not found!`);
        process.exit(1);
    }

    console.log(`[10DLC Assignment] Found team: ${team.name} (${team.slug})`);

    // Upsert SMS config
    const smsConfig = await prisma.teamSmsConfig.upsert({
        where: { team_id: LEDGER1_TEAM_ID },
        create: {
            team_id: LEDGER1_TEAM_ID,
            // Brand Registration
            brand_registration_id: BRAND_REGISTRATION_ID,
            brand_status: "APPROVED",
            brand_name: "The Utility Company LLC",
            brand_vertical: "TECHNOLOGY",
            brand_company_type: "PRIVATE_PROFIT",
            brand_website_url: "https://ledger1.ai",
            brand_street: "1005 Wellesley Dr. SE",
            brand_city: "Albuquerque",
            brand_state: "NM",
            brand_postal_code: "87106",
            brand_country_code: "US",
            brand_contact_email: "founders@theutilitycompany.co",
            brand_support_email: "support@ledger1.ai",
            // Campaign Registration
            campaign_registration_id: CAMPAIGN_REGISTRATION_ID,
            campaign_status: "SUBMITTED",
            campaign_use_case: "ACCOUNT_NOTIFICATION",
            campaign_description:
                "Ledger1 CRM Message Portal Notifications. When users send outreach messages to business contacts, " +
                "the recipient receives an SMS notification with a secure link to view the full message in a web portal. " +
                "This is used for B2B sales outreach and investor communications.",
            campaign_message_flow:
                "Recipients opt-in when they are added as a lead/contact in Ledger1 CRM. " +
                "Business users initiate outreach through the CRM's Push to Outreach feature. " +
                "Recipients can opt-out at any time by replying STOP or clicking unsubscribe in the portal.",
            campaign_sample_messages: [
                "You have a new message from {SenderName} at {Company}. View it here: {PortalLink}. Reply STOP to unsubscribe.",
                "{RecipientName}, there's a message waiting for you in your secure portal: {PortalLink}. Reply STOP to opt out.",
                "New business communication from {Company}. Read the full message: {PortalLink}. Text STOP to unsubscribe.",
            ],
            campaign_help_message:
                "Ledger1 CRM Message Portal: You're receiving notifications about secure business messages. " +
                "Reply STOP to opt out. Contact support@ledger1.ai for help.",
            campaign_opt_out_message:
                "You've been unsubscribed from Ledger1 message notifications. " +
                "You will no longer receive SMS alerts. Reply START to re-subscribe.",
            // Settings
            sms_enabled: false, // Enable after campaign approval
            monthly_budget: 100,
            daily_limit: 500,
            // Timestamps
            brand_submitted_at: new Date(),
            brand_approved_at: new Date(),
            campaign_submitted_at: new Date(),
        },
        update: {
            brand_registration_id: BRAND_REGISTRATION_ID,
            brand_status: "APPROVED",
            campaign_registration_id: CAMPAIGN_REGISTRATION_ID,
            campaign_status: "SUBMITTED",
        },
    });

    console.log("[10DLC Assignment] SMS Config created/updated:");
    console.log(`  - ID: ${smsConfig.id}`);
    console.log(`  - Team ID: ${smsConfig.team_id}`);
    console.log(`  - Brand Registration: ${smsConfig.brand_registration_id}`);
    console.log(`  - Brand Status: ${smsConfig.brand_status}`);
    console.log(`  - Campaign Registration: ${smsConfig.campaign_registration_id}`);
    console.log(`  - Campaign Status: ${smsConfig.campaign_status}`);
    console.log(`  - SMS Enabled: ${smsConfig.sms_enabled}`);

    console.log("\n[10DLC Assignment] Complete! Next steps:");
    console.log("  1. Wait for campaign approval from AWS (1-7 business days)");
    console.log("  2. Once approved, request a 10DLC phone number");
    console.log("  3. Update the SMS config with the phone number details");
    console.log("  4. Enable SMS sending in the config");
}

main()
    .catch((e) => {
        console.error("[10DLC Assignment] Error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
