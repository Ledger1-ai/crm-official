import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { logActivity } from "@/actions/audit";
import { getCurrentUserTeamId } from "@/lib/team-utils";

// GET /api/campaigns/[projectId]/opportunities
// List project-scoped opportunities
export async function GET(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { projectId } = await ctx.params;
    if (!projectId) return new NextResponse("Missing projectId", { status: 400 });

    // Get current user's team for team-based access
    const teamInfo = await getCurrentUserTeamId();
    const userTeamId = teamInfo?.teamId;

    // Access check: user owns, is shared, or team member with public visibility
    const project = await prismadb.boards.findUnique({
      where: { id: projectId },
      select: { id: true, user: true, sharedWith: true, title: true, team_id: true, visibility: true },
    });
    if (!project) return new NextResponse("Project not found", { status: 404 });

    const isOwner = project.user === session.user.id;
    const isShared = (project.sharedWith || []).includes(session.user.id);
    const isTeamPublic = userTeamId && project.team_id === userTeamId && project.visibility === "public";
    const canAccess = isOwner || isShared || isTeamPublic;
    if (!canAccess) return new NextResponse("Forbidden", { status: 403 });

    const opportunities = await (prismadb as any).project_Opportunities.findMany({
      where: { project: projectId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ project, opportunities }, { status: 200 });
  } catch (e) {
    console.error("[PROJECT_OPPORTUNITIES_GET]", e);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST /api/campaigns/[projectId]/opportunities
// Create a new project-scoped opportunity
export async function POST(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { projectId } = await ctx.params;
    if (!projectId) return new NextResponse("Missing projectId", { status: 400 });

    const body = await req.json().catch(() => ({}));
    const title = String(body?.title || "").trim();
    const description = String(body?.description || "").trim() || null;
    const category = String(body?.category || "FEATURE_BUILDOUT").trim();
    const valueEstimate = typeof body?.valueEstimate === "number" ? body.valueEstimate : undefined;

    if (!title) return new NextResponse("Missing title", { status: 400 });
    if (!["FEATURE_BUILDOUT", "COMMISSIONED_WORK", "OTHER"].includes(category)) {
      return new NextResponse("Invalid category", { status: 400 });
    }

    // Get current user's team for team-based access
    const teamInfo = await getCurrentUserTeamId();
    const userTeamId = teamInfo?.teamId;

    // Access check: user owns, is shared, or team member with public visibility
    const project = await prismadb.boards.findUnique({
      where: { id: projectId },
      select: { id: true, user: true, sharedWith: true, title: true, team_id: true, visibility: true },
    });
    if (!project) return new NextResponse("Project not found", { status: 404 });

    const isOwner = project.user === session.user.id;
    const isShared = (project.sharedWith || []).includes(session.user.id);
    const isTeamPublic = userTeamId && project.team_id === userTeamId && project.visibility === "public";
    const canAccess = isOwner || isShared || isTeamPublic;
    if (!canAccess) return new NextResponse("Forbidden", { status: 403 });

    const created = await (prismadb as any).project_Opportunities.create({
      data: {
        v: 0,
        project: projectId,
        title,
        description,
        category,
        status: "OPEN",
        valueEstimate: valueEstimate as any,
        createdAt: new Date() as any,
        createdBy: session.user.id,
        assignedTo: session.user.id,
        relatedTasksIDs: [],
      },
    });

    await logActivity("Created Feature/Opportunity", "Features", `Created in project ${project.title}: ${title}`);

    return NextResponse.json({ ok: true, opportunity: created }, { status: 200 });
  } catch (e) {
    console.error("[PROJECT_OPPORTUNITIES_POST]", e);
    return new NextResponse("Internal Error", { status: 500 });

  }
}
