import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";

/**
 * GET /api/projects/[projectId]/summary
 * Returns project (Board) summary fields for composing prompts and campaigns:
 * Includes all context fields for campaign auto-population
 */
export async function GET(_req: Request, props: { params: Promise<{ projectId: string }> }) {
    try {
        const params = await props.params;
        const { projectId } = params;
        if (!projectId) {
            return new NextResponse("Missing projectId", { status: 400 });
        }

        // Mongo ObjectId string is stored in Boards.id; Prisma can query directly by id
        const board = await (prismadb as any).Boards.findUnique({
            where: { id: projectId },
            select: {
                id: true,
                title: true,
                description: true,
                brand_logo_url: true,
                brand_primary_color: true,
                // New project context fields
                target_industries: true,
                target_geos: true,
                target_titles: true,
                campaign_brief: true,
                messaging_tone: true,
                key_value_props: true,
                meeting_link: true,
                signature_template: true,
                require_approval: true,
                status: true,
            },
        });

        if (!board) {
            return new NextResponse("Project not found", { status: 404 });
        }

        return NextResponse.json(
            {
                id: String(board.id || ""),
                title: String(board.title || ""),
                description: String(board.description || ""),
                brand_logo_url: board.brand_logo_url || "",
                brand_primary_color: board.brand_primary_color || "",
                // New context fields for campaigns
                target_industries: board.target_industries || [],
                target_geos: board.target_geos || [],
                target_titles: board.target_titles || [],
                campaign_brief: board.campaign_brief || "",
                messaging_tone: board.messaging_tone || "",
                key_value_props: board.key_value_props || [],
                meeting_link: board.meeting_link || "",
                signature_template: board.signature_template || "",
                require_approval: board.require_approval || false,
                status: board.status || "DRAFT",
            },
            { status: 200 },
        );
    } catch (error) {

        console.error("[PROJECT_SUMMARY_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
