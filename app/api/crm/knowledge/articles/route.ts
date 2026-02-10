import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

// POST: Create or update a Help Hub article
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthenticated", { status: 401 });

    try {
        const teamInfo = await getCurrentUserTeamId();
        const body = await req.json();

        const {
            title,
            content,
            summary,
            category_id,
            tags = [],
            keywords = [],
            is_internal = false,
            status = "DRAFT",
        } = body;

        if (!title || !content) {
            return new NextResponse("Title and content are required", { status: 400 });
        }

        // Generate slug from title
        const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
            .substring(0, 80);

        const article = await (prismadb as any).knowledgeArticle.create({
            data: {
                title,
                slug,
                summary,
                content,
                status,
                category_id: category_id || undefined,
                tags,
                keywords,
                is_internal,
                author_id: session.user.id,
                team_id: teamInfo?.teamId || undefined,
                publishedAt: status === "PUBLISHED" ? new Date() : undefined,
            },
            include: {
                category: { select: { id: true, name: true } },
                author: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json(article, { status: 201 });
    } catch (error) {
        console.error("[KB_ARTICLE_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// GET: List/search Help Hub articles
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthenticated", { status: 401 });

    try {
        const teamInfo = await getCurrentUserTeamId();
        const { searchParams } = new URL(req.url);

        const query = searchParams.get("q");
        const categoryId = searchParams.get("category_id");
        const status = searchParams.get("status") || "PUBLISHED";
        const limit = parseInt(searchParams.get("limit") || "50", 10);

        const where: any = {};

        if (!teamInfo?.isGlobalAdmin && teamInfo?.teamId) {
            where.team_id = teamInfo.teamId;
        }

        if (status !== "ALL") where.status = status;
        if (categoryId) where.category_id = categoryId;

        // Text search across title, summary, content, tags, keywords
        if (query) {
            where.OR = [
                { title: { contains: query, mode: "insensitive" } },
                { summary: { contains: query, mode: "insensitive" } },
                { content: { contains: query, mode: "insensitive" } },
                { tags: { hasSome: [query.toLowerCase()] } },
                { keywords: { hasSome: [query.toLowerCase()] } },
            ];
        }

        const articles = await (prismadb as any).knowledgeArticle.findMany({
            where,
            include: {
                category: { select: { id: true, name: true, icon: true } },
                author: { select: { id: true, name: true } },
                _count: { select: { article_links: true } },
            },
            orderBy: [
                { is_pinned: "desc" },
                { helpful_count: "desc" },
                { updatedAt: "desc" },
            ],
            take: limit,
        });

        return NextResponse.json(articles);
    } catch (error) {
        console.error("[KB_ARTICLES_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// PUT: Update article
export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthenticated", { status: 401 });

    try {
        const body = await req.json();
        const { id, ...updateData } = body;

        if (!id) return new NextResponse("Article ID required", { status: 400 });

        // If publishing for the first time
        if (updateData.status === "PUBLISHED") {
            const existing = await (prismadb as any).knowledgeArticle.findUnique({
                where: { id },
                select: { publishedAt: true },
            });
            if (!existing?.publishedAt) {
                updateData.publishedAt = new Date();
            }
        }

        const updated = await (prismadb as any).knowledgeArticle.update({
            where: { id },
            data: updateData,
            include: {
                category: { select: { id: true, name: true } },
                author: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("[KB_ARTICLE_PUT]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
