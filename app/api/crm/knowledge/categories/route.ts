import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

// POST: Create a Help Hub category
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthenticated", { status: 401 });

    try {
        const teamInfo = await getCurrentUserTeamId();
        const body = await req.json();
        const { name, description, icon, parent_id, order } = body;

        if (!name) return new NextResponse("Name is required", { status: 400 });

        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

        const category = await (prismadb as any).knowledgeCategory.create({
            data: {
                name,
                slug,
                description,
                icon,
                order: order || 0,
                parent_id: parent_id || undefined,
                team_id: teamInfo?.teamId || undefined,
            },
            include: {
                children: { select: { id: true, name: true } },
                _count: { select: { articles: true } },
            },
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error("[KB_CATEGORY_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// GET: List categories
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthenticated", { status: 401 });

    try {
        const teamInfo = await getCurrentUserTeamId();
        const where: any = {};

        if (!teamInfo?.isGlobalAdmin && teamInfo?.teamId) {
            where.team_id = teamInfo.teamId;
        }

        const categories = await (prismadb as any).knowledgeCategory.findMany({
            where,
            include: {
                children: {
                    select: { id: true, name: true, slug: true, order: true },
                    orderBy: { order: "asc" },
                },
                _count: { select: { articles: true } },
            },
            orderBy: { order: "asc" },
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error("[KB_CATEGORIES_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
