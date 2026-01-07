import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthenticated", { status: 401 });
  try {
    const teamInfo = await getCurrentUserTeamId();
    const teamId = teamInfo?.teamId;

    const orConditions: any[] = [
      { user: session.user.id },
      { sharedWith: { has: session.user.id } },
    ];

    if (teamId) {
      orConditions.push({
        team_id: teamId,
        visibility: "public"
      });
    }

    // Return projects (boards) accessible to the user
    const boards = await prismadb.boards.findMany({
      where: {
        OR: orConditions,
      },
      select: { id: true, title: true, description: true, visibility: true, brand_logo_url: true, user: true, assigned_user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ projects: boards }, { status: 200 });
  } catch (e) {
    console.log("[PROJECTS_GET]", e);
    return new NextResponse("Initial error", { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const body = await req.json();
  const {
    title,
    description,
    visibility,
    brand_logo_url,
    brand_primary_color,
    // New context fields
    target_industries,
    target_geos,
    target_titles,
    campaign_brief,
    messaging_tone,
    key_value_props,
    meeting_link,
    signature_template,
    require_approval,
  } = body as any;

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  if (!title) {
    return new NextResponse("Missing project name", { status: 400 });
  }

  if (!description) {
    return new NextResponse("Missing project description", { status: 400 });
  }

  try {
    const teamInfo = await getCurrentUserTeamId();
    const teamId = teamInfo?.teamId;

    const boardsCount = await (prismadb as any).boards.count();

    const newBoard = await (prismadb as any).boards.create({
      data: {
        v: 0,
        user: session.user.id,
        team_id: teamId, // Assign team
        title: title,
        description: description,
        position: boardsCount > 0 ? boardsCount : 0,
        visibility: visibility,
        sharedWith: [session.user.id],
        createdBy: session.user.id,
        // Status starts as DRAFT
        status: "DRAFT",
        // Branding (optional)
        brand_logo_url: typeof brand_logo_url === "string" ? brand_logo_url : undefined,
        brand_primary_color: typeof brand_primary_color === "string" ? brand_primary_color : undefined,
        // Context fields
        target_industries: Array.isArray(target_industries) ? target_industries : [],
        target_geos: Array.isArray(target_geos) ? target_geos : [],
        target_titles: Array.isArray(target_titles) ? target_titles : [],
        campaign_brief: typeof campaign_brief === "string" ? campaign_brief : undefined,
        messaging_tone: typeof messaging_tone === "string" ? messaging_tone : undefined,
        key_value_props: Array.isArray(key_value_props) ? key_value_props : [],
        meeting_link: typeof meeting_link === "string" ? meeting_link : undefined,
        signature_template: typeof signature_template === "string" ? signature_template : undefined,
        // Workflow settings
        require_approval: require_approval === true,
      },
    });

    const newSection = await (prismadb as any).sections.create({
      data: {
        v: 0,
        board: newBoard.id,
        title: "Backlog",
        position: 0,
      },
    });

    // Seed default Gamma link document and attach to a starter task
    const gammaUrl = "https://gamma.app/docs/Enterprise-AI-Powered-CRM-Solution-fjlbdthvn33tu1w";
    const gammaDoc = await (prismadb as any).documents.create({
      data: {
        document_name: "Project Overview (Gamma)",
        description: "Enterprise AI-Powered CRM Solution overview",
        document_file_mimeType: "text/html",
        document_file_url: gammaUrl,
        created_by_user: session.user.id,
        team_id: teamId, // Assign team to document
        visibility: "public",
        tags: { type: "link", provider: "gamma" } as any,
      },
    });

    await (prismadb as any).tasks.create({
      data: {
        v: 0,
        title: "Project Documents",
        content: "Default project overview link attached",
        priority: "MEDIUM",
        position: 0,
        section: newSection.id,
        documentIDs: [gammaDoc.id],
        user: session.user.id,
        team_id: teamId, // Assign team to task
      },
    });

    return NextResponse.json({ newBoard }, { status: 200 });
  } catch (error) {
    console.log("[NEW_BOARD_POST]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  const body = await req.json();
  const { id, title, description, visibility, brand_logo_url, brand_primary_color } = body as any;

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  if (!title) {
    return new NextResponse("Missing project name", { status: 400 });
  }

  if (!description) {
    return new NextResponse("Missing project description", { status: 400 });
  }

  try {
    await (prismadb as any).boards.update({
      where: {
        id,
      },
      data: {
        title: title,
        description: description,
        visibility: visibility,
        // Optional branding updates if provided
        ...(typeof brand_logo_url === "string" ? { brand_logo_url } : {}),
        ...(typeof brand_primary_color === "string" ? { brand_primary_color } : {}),
        updatedBy: session.user.id,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      { message: "Board updated successfullsy" },
      { status: 200 }
    );
  } catch (error) {
    console.log("[UPDATE_BOARD_POST]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}
