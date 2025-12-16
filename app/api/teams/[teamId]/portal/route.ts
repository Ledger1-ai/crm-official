/**
 * Team Portal API
 * Each team has one message portal for SMS recipients
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import crypto from "crypto";

// GET - Get the team's portal
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ teamId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { teamId } = await params;

        // Check user belongs to this team
        const user = await prismadb.users.findUnique({
            where: { id: session.user.id },
            include: { assigned_team: true },
        });

        if (user?.assigned_team?.id !== teamId && !session.user.isAdmin) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const portal = await (prismadb.crm_Message_Portal as any).findFirst({
            where: { team_id: teamId },
            include: {
                _count: {
                    select: {
                        recipients: true,
                        messages: true,
                    },
                },
            },
        });

        return NextResponse.json({ portal });
    } catch (err: any) {
        console.error("[Team Portal API] GET Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST - Create or update the team's portal
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ teamId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { teamId } = await params;

        // Validate teamId
        if (!teamId || teamId === "undefined") {
            return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
        }

        // Check user belongs to this team
        const user = await prismadb.users.findUnique({
            where: { id: session.user.id },
            include: { assigned_team: true },
        });

        if (user?.assigned_team?.id !== teamId && !session.user.isAdmin) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const body = await req.json();

        // Support both old field names (camelCase) and new field names (snake_case)
        const portalName = body.name || body.portalName;
        const logoUrl = body.logo_url || body.logoUrl;
        const primaryColor = body.primary_color || body.primaryColor || "#14b8a6";
        const secondaryColor = body.secondary_color || body.secondaryColor || "#f5f5f5";
        const accentColor = body.accent_color || body.accentColor || "#10b981";
        const welcomeMessage = body.welcome_message || body.welcomeMessage;
        const showSenderInfo = body.show_sender_info ?? body.showSenderInfo ?? true;

        // New theme fields
        const themeMode = body.theme_mode || "AUTO";
        const darkPrimaryColor = body.dark_primary_color || primaryColor;
        const darkSecondaryColor = body.dark_secondary_color || "#1f2937";
        const darkAccentColor = body.dark_accent_color || accentColor;
        const enableGlassEffect = body.enable_glass_effect !== false;
        const backgroundBlur = body.background_blur || 20;
        const logoType = body.logo_type || "custom";
        const projectId = body.project || body.project_id || null;

        // Check if team already has a portal
        let existingPortal = await (prismadb.crm_Message_Portal as any).findFirst({
            where: { team_id: teamId },
        });

        let portal;
        if (existingPortal) {
            // Update existing portal
            portal = await (prismadb.crm_Message_Portal as any).update({
                where: { id: existingPortal.id },
                data: {
                    portal_name: portalName || existingPortal.portal_name,
                    logo_url: logoUrl || null,
                    logo_type: logoType,
                    project: projectId,
                    primary_color: primaryColor,
                    secondary_color: secondaryColor,
                    accent_color: accentColor,
                    welcome_message: welcomeMessage || null,
                    show_sender_info: showSenderInfo,
                    theme_mode: themeMode as any,
                    dark_primary_color: darkPrimaryColor,
                    dark_secondary_color: darkSecondaryColor,
                    dark_accent_color: darkAccentColor,
                    enable_glass_effect: enableGlassEffect,
                    background_blur: backgroundBlur,
                },
                include: {
                    _count: {
                        select: {
                            recipients: true,
                            messages: true,
                        },
                    },
                },
            });
        } else {
            // Create new portal for the team
            const team = await prismadb.team.findUnique({
                where: { id: teamId },
                select: { name: true },
            });

            if (!team) {
                return NextResponse.json({ error: "Team not found" }, { status: 404 });
            }

            const slug = generateSlug(portalName || team.name || "portal");

            portal = await (prismadb.crm_Message_Portal as any).create({
                data: {
                    portal_name: portalName || `${team.name} Portal`,
                    portal_slug: slug,
                    team_id: teamId,
                    logo_url: logoUrl || null,
                    logo_type: logoType,
                    project: projectId,
                    primary_color: primaryColor,
                    secondary_color: secondaryColor,
                    accent_color: accentColor,
                    welcome_message: welcomeMessage || null,
                    show_sender_info: showSenderInfo,
                    theme_mode: themeMode as any,
                    dark_primary_color: darkPrimaryColor,
                    dark_secondary_color: darkSecondaryColor,
                    dark_accent_color: darkAccentColor,
                    enable_glass_effect: enableGlassEffect,
                    background_blur: backgroundBlur,
                },
                include: {
                    _count: {
                        select: {
                            recipients: true,
                            messages: true,
                        },
                    },
                },
            });
        }

        return NextResponse.json({ portal });
    } catch (err: any) {
        console.error("[Team Portal API] POST Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

function generateSlug(name: string): string {
    const base = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    const random = crypto.randomBytes(4).toString("hex");
    return `${base}-${random}`;
}
