/**
 * Regenerate Portal Slug API
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import crypto from "crypto";

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

        // Check user belongs to this team
        const user = await prismadb.users.findUnique({
            where: { id: session.user.id },
            include: { assigned_team: true },
        });

        if (user?.assigned_team?.id !== teamId && !session.user.isAdmin) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Find the team's portal
        const existingPortal = await (prismadb.crm_Message_Portal as any).findFirst({
            where: { team_id: teamId },
        });

        if (!existingPortal) {
            return NextResponse.json({ error: "No portal found for this team" }, { status: 404 });
        }

        // Generate new slug
        const newSlug = generateSlug(existingPortal.portal_name);

        const portal = await (prismadb.crm_Message_Portal as any).update({
            where: { id: existingPortal.id },
            data: {
                portal_slug: newSlug,
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

        return NextResponse.json({ portal });
    } catch (err: any) {
        console.error("[Portal Regenerate Slug] Error:", err);
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
