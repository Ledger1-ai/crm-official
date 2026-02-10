import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST: Add a comment to a case
export async function POST(
    req: Request,
    { params }: { params: Promise<{ caseId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new NextResponse("Unauthenticated", { status: 401 });
    }

    try {
        const { caseId } = await params;
        const body = await req.json();
        const { body: commentBody, is_public = true } = body;

        if (!commentBody) {
            return new NextResponse("Comment body is required", { status: 400 });
        }

        // Verify case exists
        const caseExists = await (prismadb as any).crm_Cases.findUnique({
            where: { id: caseId },
            select: { id: true, first_response_at: true, status: true },
        });

        if (!caseExists) {
            return new NextResponse("Case not found", { status: 404 });
        }

        const comment = await (prismadb as any).crm_Case_Comments.create({
            data: {
                case_id: caseId,
                body: commentBody,
                is_public,
                author_id: session.user.id,
            },
            include: {
                author: {
                    select: { id: true, name: true, email: true, avatar: true },
                },
            },
        });

        // Mark first response if this is the first agent comment on a NEW/OPEN case
        if (
            !caseExists.first_response_at &&
            ["NEW", "OPEN"].includes(caseExists.status)
        ) {
            await (prismadb as any).crm_Cases.update({
                where: { id: caseId },
                data: {
                    first_response_at: new Date(),
                    status: caseExists.status === "NEW" ? "OPEN" : caseExists.status,
                },
            });
        }

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        console.error("[CREATE_CASE_COMMENT_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// GET: Get all comments for a case
export async function GET(
    req: Request,
    { params }: { params: Promise<{ caseId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new NextResponse("Unauthenticated", { status: 401 });
    }

    try {
        const { caseId } = await params;
        const comments = await (prismadb as any).crm_Case_Comments.findMany({
            where: { case_id: caseId },
            include: {
                author: {
                    select: { id: true, name: true, email: true, avatar: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(comments, { status: 200 });
    } catch (error) {
        console.error("[GET_CASE_COMMENTS]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
