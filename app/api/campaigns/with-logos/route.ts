/**
 * GET /api/campaigns/with-logos
 * Fetches user's projects (Boards) that have brand logos configured
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user with team
        const user = await prismadb.users.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                team_id: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Build query conditions
        const whereConditions: any = {
            OR: [
                { user: user.id }, // Projects owned by user
            ]
        };

        // Include team projects if user has a team
        if (user.team_id) {
            whereConditions.OR.push({ team_id: user.team_id });
        }

        // Fetch all projects user has access to
        const projects = await prismadb.boards.findMany({
            where: whereConditions,
            select: {
                id: true,
                title: true,
                description: true,
                icon: true,
                brand_logo_url: true,
                brand_primary_color: true,
            },
            orderBy: { title: 'asc' }
        });

        // Filter to only those with logos, but also include all for the dropdown
        const projectsWithLogos = projects.filter(p => p.brand_logo_url);
        const projectsWithoutLogos = projects.filter(p => !p.brand_logo_url);

        return NextResponse.json({
            // Projects that have logos configured
            withLogos: projectsWithLogos.map(p => ({
                id: p.id,
                name: p.title,
                logo_url: p.brand_logo_url,
                primary_color: p.brand_primary_color,
                icon: p.icon,
            })),
            // All projects (for dropdown selector)
            all: projects.map(p => ({
                id: p.id,
                name: p.title,
                logo_url: p.brand_logo_url,
                primary_color: p.brand_primary_color,
                icon: p.icon,
                description: p.description?.substring(0, 100),
            })),
        });
    } catch (error: any) {
        console.error("[GET /api/campaigns/with-logos] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch projects" },
            { status: 500 }
        );
    }
}
