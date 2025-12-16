/**
 * SMS Status API
 * Check if SMS is configured and active for the current user's team
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ configured: false, reason: "Unauthorized" });
        }

        // Get user's team
        const user = await prismadb.users.findUnique({
            where: { id: session.user.id },
            include: { assigned_team: true },
        });

        if (!user?.assigned_team?.id) {
            return NextResponse.json({
                configured: false,
                reason: "No team assigned"
            });
        }

        const teamId = user.assigned_team.id;

        // Check if the team has SMS configuration using raw query to avoid TS errors
        // (SMS fields may not be in the Prisma schema yet)
        let hasTeamPhone = false;
        let has10dlc = false;

        try {
            const teamData: any = await prismadb.team.findUnique({
                where: { id: teamId },
            });

            // Check for SMS fields if they exist
            hasTeamPhone = !!(teamData as any)?.sms_phone_arn;
            has10dlc = !!(teamData as any)?.sms_10dlc_brand_id && !!(teamData as any)?.sms_10dlc_campaign_id;
        } catch (e) {
            // Fields may not exist yet
        }

        // Check environment variables for fallback (system-wide phone number)
        const hasEnvPhone = !!process.env.EUM_PORTAL_PHONE_ARN;

        const configured = hasTeamPhone || hasEnvPhone;
        const status = {
            configured,
            hasTeamPhone,
            has10dlcRegistration: has10dlc,
            hasSystemPhone: hasEnvPhone,
            reason: !configured ? "No SMS phone number configured for this team" : undefined,
            message: configured
                ? "SMS is active and ready to send"
                : "SMS requires 10DLC registration and a verified phone number. Contact your administrator to enable SMS.",
        };

        return NextResponse.json(status);
    } catch (err: any) {
        console.error("[SMS Status] Error:", err);
        return NextResponse.json({
            configured: false,
            reason: err.message
        });
    }
}
