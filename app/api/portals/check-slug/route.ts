/**
 * Check Portal Slug Availability API
 * Checks if a slug is available, reserved, or already taken
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

// Reserved slugs that cannot be used
const RESERVED_SLUGS = [
    'demo', 'preview', 'admin', 'api', 'static', 'assets',
    'login', 'logout', 'signup', 'register', 'settings',
    'dashboard', 'profile', 'help', 'support', 'about',
    'terms', 'privacy', 'contact', 'blog', 'docs',
    'm', 'message', 'messages', 'new', 'create', 'edit',
];

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const slug = searchParams.get("slug");
        const excludePortalId = searchParams.get("excludeId"); // For editing existing portals

        if (!slug) {
            return NextResponse.json({ error: "Slug is required" }, { status: 400 });
        }

        // Normalize slug
        const normalizedSlug = slug
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

        // Validate slug format
        if (normalizedSlug.length < 3) {
            return NextResponse.json({
                available: false,
                reason: "too_short",
                message: "Slug must be at least 3 characters",
                normalizedSlug,
            });
        }

        if (normalizedSlug.length > 50) {
            return NextResponse.json({
                available: false,
                reason: "too_long",
                message: "Slug must be 50 characters or less",
                normalizedSlug,
            });
        }

        // Check if reserved
        if (RESERVED_SLUGS.includes(normalizedSlug)) {
            return NextResponse.json({
                available: false,
                reason: "reserved",
                message: "This slug is reserved for system use",
                normalizedSlug,
            });
        }

        // Check if already taken
        const existingPortal = await (prismadb.crm_Message_Portal as any).findFirst({
            where: {
                portal_slug: normalizedSlug,
                ...(excludePortalId ? { NOT: { id: excludePortalId } } : {}),
            },
            select: { id: true },
        });

        if (existingPortal) {
            return NextResponse.json({
                available: false,
                reason: "taken",
                message: "This slug is already in use by another portal",
                normalizedSlug,
            });
        }

        // Slug is available
        return NextResponse.json({
            available: true,
            normalizedSlug,
            message: "This slug is available",
        });
    } catch (err: any) {
        console.error("[Check Slug API] Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
