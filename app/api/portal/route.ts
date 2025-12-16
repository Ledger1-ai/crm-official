/**
 * Portal Management API
 * Create, list, and manage message portals for projects/teams
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import crypto from "crypto";

// GET - List portals for user
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get("projectId");

        const where: any = {
            created_by: session.user.id,
        };
        if (projectId) where.project = projectId;

        const portals = await (prismadb as any).crm_Message_Portal.findMany({
            where,
            include: {
                _count: {
                    select: {
                        recipients: true,
                        messages: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ portals });
    } catch (err: any) {
        console.error("[Portal API] GET Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST - Create new portal
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            projectId,
            name,
            slug,
            logoUrl,
            primaryColor,
            secondaryColor,
            welcomeMessage,
            showSenderInfo,
        } = body;

        if (!name) {
            return NextResponse.json({ error: "Portal name is required" }, { status: 400 });
        }

        // Generate a unique slug if not provided
        const portalSlug = slug || generateSlug(name);

        // Check if slug already exists
        const existing = await (prismadb as any).crm_Message_Portal.findUnique({
            where: { portal_slug: portalSlug },
        });

        if (existing) {
            return NextResponse.json({ error: "Portal slug already exists" }, { status: 409 });
        }

        const portal = await (prismadb as any).crm_Message_Portal.create({
            data: {
                portal_name: name,
                portal_slug: portalSlug,
                project: projectId || null,
                logo_url: logoUrl,
                primary_color: primaryColor || "#F54029",
                secondary_color: secondaryColor || "#1f2937",
                welcome_message: welcomeMessage,
                show_sender_info: showSenderInfo ?? true,
                created_by: session.user.id,
            },
        });

        return NextResponse.json({ portal });
    } catch (err: any) {
        console.error("[Portal API] POST Error:", err);
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
