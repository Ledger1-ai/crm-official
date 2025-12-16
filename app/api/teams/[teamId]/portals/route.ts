/**
 * Team Portals API (Multi-portal support)
 * Supports multiple portals per team, each linked to a project
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import crypto from "crypto";

// Reserved slugs that cannot be used
const RESERVED_SLUGS = [
    'demo', 'preview', 'admin', 'api', 'static', 'assets',
    'login', 'logout', 'signup', 'register', 'settings',
    'dashboard', 'profile', 'help', 'support', 'about',
    'terms', 'privacy', 'contact', 'blog', 'docs',
];

// GET - Get all portals for the team
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

        const portals = await (prismadb.crm_Message_Portal as any).findMany({
            where: { team_id: teamId },
            include: {
                _count: {
                    select: {
                        recipients: true,
                        messages: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Map to include project info
        const portalsWithProjectInfo = await Promise.all(
            portals.map(async (portal: any) => {
                let projectInfo = null;
                if (portal.project) {
                    const project = await prismadb.boards.findUnique({
                        where: { id: portal.project },
                        select: { id: true, title: true, brand_logo_url: true, brand_primary_color: true },
                    });
                    if (project) {
                        projectInfo = {
                            id: project.id,
                            name: project.title,
                            logo_url: project.brand_logo_url,
                            primary_color: project.brand_primary_color,
                        };
                    }
                }
                return {
                    ...portal,
                    slug: portal.portal_slug,
                    name: portal.portal_name,
                    projectInfo,
                };
            })
        );

        return NextResponse.json({ portals: portalsWithProjectInfo });
    } catch (err: any) {
        console.error("[Team Portals API] GET Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST - Create a new portal for a project
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

        // Extract fields
        const portalName = body.name || body.portal_name;
        const projectId = body.project_id || body.project;
        const customSlug = body.custom_slug;
        const logoUrl = body.logo_url;
        const logoType = body.logo_type || "custom";
        const primaryColor = body.primary_color || "#14b8a6";
        const secondaryColor = body.secondary_color || "#f5f5f5";
        const accentColor = body.accent_color || "#10b981";
        const welcomeMessage = body.welcome_message;
        const showSenderInfo = body.show_sender_info ?? true;
        const themeMode = body.theme_mode || "AUTO";
        const darkPrimaryColor = body.dark_primary_color || primaryColor;
        const darkSecondaryColor = body.dark_secondary_color || "#1f2937";
        const darkAccentColor = body.dark_accent_color || accentColor;
        const enableGlassEffect = body.enable_glass_effect !== false;
        const backgroundBlur = body.background_blur || 20;

        if (!portalName) {
            return NextResponse.json({ error: "Portal name is required" }, { status: 400 });
        }

        // Check if project already has a portal for this team
        if (projectId) {
            const existingPortal = await (prismadb.crm_Message_Portal as any).findFirst({
                where: {
                    team_id: teamId,
                    project: projectId,
                },
            });
            if (existingPortal) {
                return NextResponse.json({
                    error: "A portal already exists for this project. Edit the existing portal instead.",
                    existingPortalId: existingPortal.id,
                }, { status: 409 });
            }
        }

        // Generate or validate slug
        let slug: string;
        if (customSlug) {
            // Validate custom slug format
            const normalizedSlug = customSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

            if (normalizedSlug.length < 3) {
                return NextResponse.json({ error: "Slug must be at least 3 characters" }, { status: 400 });
            }
            if (normalizedSlug.length > 50) {
                return NextResponse.json({ error: "Slug must be 50 characters or less" }, { status: 400 });
            }
            if (RESERVED_SLUGS.includes(normalizedSlug)) {
                return NextResponse.json({ error: "This slug is reserved. Please choose another." }, { status: 400 });
            }

            // Check if slug is already taken
            const existingSlug = await (prismadb.crm_Message_Portal as any).findFirst({
                where: { portal_slug: normalizedSlug },
            });
            if (existingSlug) {
                return NextResponse.json({ error: "This slug is already in use. Please choose another." }, { status: 409 });
            }

            slug = normalizedSlug;
        } else {
            slug = generateSlug(portalName);
        }

        // Create the portal
        const portal = await (prismadb.crm_Message_Portal as any).create({
            data: {
                portal_name: portalName,
                portal_slug: slug,
                team_id: teamId,
                project: projectId || null,
                logo_url: logoUrl || null,
                logo_type: logoType,
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

        return NextResponse.json({
            portal: {
                ...portal,
                slug: portal.portal_slug,
                name: portal.portal_name,
            },
        });
    } catch (err: any) {
        console.error("[Team Portals API] POST Error:", err);
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
