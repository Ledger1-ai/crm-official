/**
 * API Route: /api/teams/[teamId]/sms-config
 * CRUD operations for Team SMS Configuration (10DLC)
 * SuperAdmin only access
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
// AWS EUM functions are lazy-loaded only when needed to avoid build warnings
// when the @aws-sdk/client-pinpoint-sms-voice-v2 package is not installed
async function getAwsRegistrationStatus(registrationId: string) {
    try {
        const { getRegistrationStatus } = await import("@/lib/aws/eum-10dlc");
        return await getRegistrationStatus(registrationId);
    } catch (err) {
        console.error("[SMS Config] AWS EUM SDK not available:", err);
        return null;
    }
}

// Check if user is SuperAdmin
async function isSuperAdmin(userId: string): Promise<boolean> {
    const user = await prismadb.users.findUnique({
        where: { id: userId },
        include: { assigned_role: true },
    });

    if (!user) return false;

    // Check for SuperAdmin role or is_admin flag
    return (
        user.is_admin === true ||
        user.assigned_role?.name === "SuperAdmin" ||
        (user.assigned_role?.permissions?.includes("SUPER_ADMIN") ?? false)
    );
}

// GET - Fetch SMS config for a team
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ teamId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const isAdmin = await isSuperAdmin(session.user.id);
        if (!isAdmin) {
            return NextResponse.json({ error: "SuperAdmin access required" }, { status: 403 });
        }

        const { teamId } = await params;

        // Fetch team with SMS config
        const team = await prismadb.team.findUnique({
            where: { id: teamId },
            include: { sms_config: true },
        });

        if (!team) {
            return NextResponse.json({ error: "Team not found" }, { status: 404 });
        }

        // If no SMS config exists, return null
        if (!team.sms_config) {
            return NextResponse.json({
                team: { id: team.id, name: team.name, slug: team.slug },
                sms_config: null,
            });
        }

        // Optionally sync status from AWS if registration IDs exist
        let brandStatusFromAws = null;
        let campaignStatusFromAws = null;

        if (team.sms_config.brand_registration_id) {
            brandStatusFromAws = await getAwsRegistrationStatus(team.sms_config.brand_registration_id);
        }

        if (team.sms_config.campaign_registration_id) {
            campaignStatusFromAws = await getAwsRegistrationStatus(team.sms_config.campaign_registration_id);
        }

        return NextResponse.json({
            team: { id: team.id, name: team.name, slug: team.slug },
            sms_config: team.sms_config,
            aws_status: {
                brand: brandStatusFromAws,
                campaign: campaignStatusFromAws,
            },
        });
    } catch (error: any) {
        console.error("[SMS Config GET] Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}

// POST - Create or update SMS config
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ teamId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const isAdmin = await isSuperAdmin(session.user.id);
        if (!isAdmin) {
            return NextResponse.json({ error: "SuperAdmin access required" }, { status: 403 });
        }

        const { teamId } = await params;
        const body = await request.json();

        // Check if team exists
        const team = await prismadb.team.findUnique({
            where: { id: teamId },
        });

        if (!team) {
            return NextResponse.json({ error: "Team not found" }, { status: 404 });
        }

        // Upsert SMS config
        const smsConfig = await prismadb.teamSmsConfig.upsert({
            where: { team_id: teamId },
            create: {
                team_id: teamId,
                // Brand fields
                brand_registration_id: body.brand_registration_id,
                brand_status: body.brand_status || "PENDING",
                brand_name: body.brand_name,
                brand_ein: body.brand_ein,
                brand_vertical: body.brand_vertical,
                brand_company_type: body.brand_company_type,
                brand_website_url: body.brand_website_url,
                brand_street: body.brand_street,
                brand_city: body.brand_city,
                brand_state: body.brand_state,
                brand_postal_code: body.brand_postal_code,
                brand_country_code: body.brand_country_code || "US",
                brand_contact_email: body.brand_contact_email,
                brand_contact_phone: body.brand_contact_phone,
                brand_support_email: body.brand_support_email,
                brand_support_phone: body.brand_support_phone,
                // Campaign fields
                campaign_registration_id: body.campaign_registration_id,
                campaign_status: body.campaign_status || "PENDING",
                campaign_use_case: body.campaign_use_case || "ACCOUNT_NOTIFICATION",
                campaign_description: body.campaign_description,
                campaign_message_flow: body.campaign_message_flow,
                campaign_sample_messages: body.campaign_sample_messages || [],
                campaign_help_message: body.campaign_help_message,
                campaign_opt_out_message: body.campaign_opt_out_message,
                // Phone number fields
                phone_number_id: body.phone_number_id,
                phone_number: body.phone_number,
                phone_number_arn: body.phone_number_arn,
                phone_number_status: body.phone_number_status,
                // Configuration
                sms_enabled: body.sms_enabled || false,
                monthly_budget: body.monthly_budget || 0,
                daily_limit: body.daily_limit || 100,
                // Timestamps
                brand_submitted_at: body.brand_submitted_at ? new Date(body.brand_submitted_at) : null,
                brand_approved_at: body.brand_approved_at ? new Date(body.brand_approved_at) : null,
                campaign_submitted_at: body.campaign_submitted_at ? new Date(body.campaign_submitted_at) : null,
                campaign_approved_at: body.campaign_approved_at ? new Date(body.campaign_approved_at) : null,
            },
            update: {
                // Brand fields
                brand_registration_id: body.brand_registration_id,
                brand_status: body.brand_status,
                brand_name: body.brand_name,
                brand_ein: body.brand_ein,
                brand_vertical: body.brand_vertical,
                brand_company_type: body.brand_company_type,
                brand_website_url: body.brand_website_url,
                brand_street: body.brand_street,
                brand_city: body.brand_city,
                brand_state: body.brand_state,
                brand_postal_code: body.brand_postal_code,
                brand_country_code: body.brand_country_code,
                brand_contact_email: body.brand_contact_email,
                brand_contact_phone: body.brand_contact_phone,
                brand_support_email: body.brand_support_email,
                brand_support_phone: body.brand_support_phone,
                // Campaign fields
                campaign_registration_id: body.campaign_registration_id,
                campaign_status: body.campaign_status,
                campaign_use_case: body.campaign_use_case,
                campaign_description: body.campaign_description,
                campaign_message_flow: body.campaign_message_flow,
                campaign_sample_messages: body.campaign_sample_messages,
                campaign_help_message: body.campaign_help_message,
                campaign_opt_out_message: body.campaign_opt_out_message,
                // Phone number fields
                phone_number_id: body.phone_number_id,
                phone_number: body.phone_number,
                phone_number_arn: body.phone_number_arn,
                phone_number_status: body.phone_number_status,
                // Configuration
                sms_enabled: body.sms_enabled,
                monthly_budget: body.monthly_budget,
                daily_limit: body.daily_limit,
                // Timestamps
                brand_submitted_at: body.brand_submitted_at ? new Date(body.brand_submitted_at) : undefined,
                brand_approved_at: body.brand_approved_at ? new Date(body.brand_approved_at) : undefined,
                campaign_submitted_at: body.campaign_submitted_at ? new Date(body.campaign_submitted_at) : undefined,
                campaign_approved_at: body.campaign_approved_at ? new Date(body.campaign_approved_at) : undefined,
            },
        });

        return NextResponse.json({
            success: true,
            sms_config: smsConfig,
        });
    } catch (error: any) {
        console.error("[SMS Config POST] Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}

// DELETE - Remove SMS config for a team
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ teamId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const isAdmin = await isSuperAdmin(session.user.id);
        if (!isAdmin) {
            return NextResponse.json({ error: "SuperAdmin access required" }, { status: 403 });
        }

        const { teamId } = await params;

        // Delete SMS config
        await prismadb.teamSmsConfig.delete({
            where: { team_id: teamId },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[SMS Config DELETE] Error:", error);
        if (error.code === "P2025") {
            return NextResponse.json({ error: "SMS config not found" }, { status: 404 });
        }
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
