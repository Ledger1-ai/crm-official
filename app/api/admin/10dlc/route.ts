/**
 * 10DLC Registration Management API
 * Admin-only endpoint for managing 10DLC brand and campaign registrations
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
    initiate10DLCRegistration,
    listAllRegistrations,
    getRegistrationStatus,
    listPhoneNumbers,
    requestPhoneNumber,
    associatePhoneNumberWithCampaign,
    LEDGER1_BRAND_CONFIG,
    PORTAL_MESSAGE_CAMPAIGN_CONFIG,
} from "@/lib/aws/eum-10dlc";

export async function GET(req: NextRequest) {
    try {
        // Auth check - admin only
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const action = searchParams.get("action") || "list";

        switch (action) {
            case "list": {
                // List all registrations
                const registrations = await listAllRegistrations();
                const phoneNumbers = await listPhoneNumbers();
                return NextResponse.json({
                    registrations,
                    phoneNumbers,
                    brandConfig: LEDGER1_BRAND_CONFIG,
                    campaignConfig: PORTAL_MESSAGE_CAMPAIGN_CONFIG,
                });
            }

            case "status": {
                const registrationId = searchParams.get("registrationId");
                if (!registrationId) {
                    return NextResponse.json(
                        { error: "registrationId required" },
                        { status: 400 }
                    );
                }
                const status = await getRegistrationStatus(registrationId);
                return NextResponse.json({ status });
            }

            default:
                return NextResponse.json(
                    { error: `Unknown action: ${action}` },
                    { status: 400 }
                );
        }
    } catch (err: any) {
        console.error("[10DLC API] Error:", err);
        return NextResponse.json(
            { error: err.message || "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        // Auth check - admin only
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const action = body.action;

        switch (action) {
            case "initiate": {
                // Start the 10DLC registration process
                const ein = body.ein; // Optional EIN for brand registration
                const result = await initiate10DLCRegistration(ein);
                return NextResponse.json(result);
            }

            case "requestPhoneNumber": {
                // Request a new phone number
                const {
                    isoCountryCode = "US",
                    messageType = "TRANSACTIONAL",
                    numberType = "TEN_DLC",
                    registrationId
                } = body;

                const phoneNumber = await requestPhoneNumber({
                    isoCountryCode,
                    messageType,
                    numberCapabilities: ["SMS"],
                    numberType,
                    registrationId,
                });

                if (!phoneNumber) {
                    return NextResponse.json(
                        { error: "Failed to request phone number" },
                        { status: 500 }
                    );
                }

                return NextResponse.json({ phoneNumber });
            }

            case "associate": {
                // Associate phone number with campaign
                const { phoneNumberId, campaignRegistrationId } = body;
                if (!phoneNumberId || !campaignRegistrationId) {
                    return NextResponse.json(
                        { error: "phoneNumberId and campaignRegistrationId required" },
                        { status: 400 }
                    );
                }

                const success = await associatePhoneNumberWithCampaign(
                    phoneNumberId,
                    campaignRegistrationId
                );

                return NextResponse.json({ success });
            }

            default:
                return NextResponse.json(
                    { error: `Unknown action: ${action}` },
                    { status: 400 }
                );
        }
    } catch (err: any) {
        console.error("[10DLC API] Error:", err);
        return NextResponse.json(
            { error: err.message || "Internal server error" },
            { status: 500 }
        );
    }
}
