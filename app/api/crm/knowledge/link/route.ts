import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST: Link a KB article to a case (or record suggested article)
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthenticated", { status: 401 });

    try {
        const body = await req.json();
        const { article_id, case_id, link_type = "MANUAL" } = body;

        if (!article_id || !case_id) {
            return new NextResponse("article_id and case_id are required", { status: 400 });
        }

        const link = await (prismadb as any).knowledgeArticleLink.upsert({
            where: {
                article_id_case_id: { article_id, case_id },
            },
            update: {
                link_type,
                linked_by: session.user.id,
            },
            create: {
                article_id,
                case_id,
                link_type,
                linked_by: session.user.id,
            },
            include: {
                article: { select: { id: true, title: true, slug: true, summary: true } },
            },
        });

        // Increment view count on the article
        await (prismadb as any).knowledgeArticle.update({
            where: { id: article_id },
            data: { view_count: { increment: 1 } },
        });

        return NextResponse.json(link, { status: 201 });
    } catch (error) {
        console.error("[KB_LINK_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// PUT: Update article link feedback (was it helpful?)
export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthenticated", { status: 401 });

    try {
        const body = await req.json();
        const { article_id, case_id, was_helpful } = body;

        if (!article_id || !case_id || was_helpful === undefined) {
            return new NextResponse("article_id, case_id, and was_helpful are required", { status: 400 });
        }

        const link = await (prismadb as any).knowledgeArticleLink.update({
            where: {
                article_id_case_id: { article_id, case_id },
            },
            data: { was_helpful },
        });

        // Update article feedback counters
        await (prismadb as any).knowledgeArticle.update({
            where: { id: article_id },
            data: was_helpful
                ? { helpful_count: { increment: 1 } }
                : { not_helpful_count: { increment: 1 } },
        });

        return NextResponse.json(link);
    } catch (error) {
        console.error("[KB_LINK_PUT]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// GET: Get article suggestions for a case (keyword matching)
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthenticated", { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const caseId = searchParams.get("case_id");

        if (!caseId) {
            return new NextResponse("case_id is required", { status: 400 });
        }

        // Get the case subject and tags for keyword matching
        const caseData = await (prismadb as any).crm_Cases.findUnique({
            where: { id: caseId },
            select: { subject: true, tags: true, type: true, team_id: true },
        });

        if (!caseData) return new NextResponse("Case not found", { status: 404 });

        // Extract keywords from case subject
        const words = caseData.subject
            .toLowerCase()
            .split(/\s+/)
            .filter((w: string) => w.length > 3);

        const searchTerms = [...words, ...(caseData.tags || [])];

        const where: any = {
            status: "PUBLISHED",
            team_id: caseData.team_id,
        };

        if (searchTerms.length > 0) {
            where.OR = [
                { keywords: { hasSome: searchTerms } },
                { tags: { hasSome: searchTerms } },
                ...searchTerms.slice(0, 5).map((term: string) => ({
                    title: { contains: term, mode: "insensitive" },
                })),
            ];
        }

        const suggestions = await (prismadb as any).knowledgeArticle.findMany({
            where,
            select: {
                id: true,
                title: true,
                slug: true,
                summary: true,
                helpful_count: true,
                view_count: true,
                category: { select: { name: true, icon: true } },
            },
            orderBy: [{ helpful_count: "desc" }, { view_count: "desc" }],
            take: 5,
        });

        // Also get already-linked articles for this case
        const linked = await (prismadb as any).knowledgeArticleLink.findMany({
            where: { case_id: caseId },
            select: { article_id: true },
        });
        const linkedIds = new Set(linked.map((l: any) => l.article_id));

        // Mark which suggestions are already linked
        const enriched = suggestions.map((s: any) => ({
            ...s,
            already_linked: linkedIds.has(s.id),
        }));

        return NextResponse.json(enriched);
    } catch (error) {
        console.error("[KB_SUGGESTIONS_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
