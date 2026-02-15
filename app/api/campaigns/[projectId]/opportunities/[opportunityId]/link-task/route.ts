import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

// POST /api/campaigns/[projectId]/opportunities/[opportunityId]/link-task
// Body: { taskId: string }
// Adds taskId to opportunity.relatedTasksIDs
export async function POST(req: Request, ctx: { params: Promise<{ projectId: string; opportunityId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { projectId, opportunityId } = await ctx.params;
    if (!projectId || !opportunityId) return new NextResponse("Missing params", { status: 400 });

    const body = await req.json().catch(() => ({}));
    const taskId = String(body?.taskId || "").trim();
    if (!taskId) return new NextResponse("Missing taskId", { status: 400 });

    // Access checks
    const project = await prismadb.boards.findUnique({ where: { id: projectId }, select: { id: true, user: true, sharedWith: true } });
    if (!project) return new NextResponse("Project not found", { status: 404 });
    const canAccess = project.user === session.user.id || (project.sharedWith || []).includes(session.user.id);
    if (!canAccess) return new NextResponse("Forbidden", { status: 403 });

    const opp = await (prismadb as any).project_Opportunities.findUnique({ where: { id: opportunityId }, select: { id: true, project: true, relatedTasksIDs: true } });
    if (!opp || opp.project !== projectId) return new NextResponse("Opportunity not found", { status: 404 });

    const current: string[] = Array.isArray(opp.relatedTasksIDs) ? opp.relatedTasksIDs : [];
    if (current.includes(taskId)) {
      return NextResponse.json({ ok: true, linked: true }, { status: 200 });
    }

    await (prismadb as any).project_Opportunities.update({
      where: { id: opportunityId },
      data: { relatedTasksIDs: [...current, taskId] },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("[OPPORTUNITY_LINK_TASK_POST]", e);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE /api/campaigns/[projectId]/opportunities/[opportunityId]/link-task
// Body: { taskId: string }
export async function DELETE(req: Request, ctx: { params: Promise<{ projectId: string; opportunityId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { projectId, opportunityId } = await ctx.params;
    if (!projectId || !opportunityId) return new NextResponse("Missing params", { status: 400 });

    const body = await req.json().catch(() => ({}));
    const taskId = String(body?.taskId || "").trim();
    if (!taskId) return new NextResponse("Missing taskId", { status: 400 });

    // Access checks
    const project = await prismadb.boards.findUnique({ where: { id: projectId }, select: { id: true, user: true, sharedWith: true } });
    if (!project) return new NextResponse("Project not found", { status: 404 });
    const canAccess = project.user === session.user.id || (project.sharedWith || []).includes(session.user.id);
    if (!canAccess) return new NextResponse("Forbidden", { status: 403 });

    const opp = await (prismadb as any).project_Opportunities.findUnique({ where: { id: opportunityId }, select: { id: true, project: true, relatedTasksIDs: true } });
    if (!opp || opp.project !== projectId) return new NextResponse("Opportunity not found", { status: 404 });

    const current: string[] = Array.isArray(opp.relatedTasksIDs) ? opp.relatedTasksIDs : [];
    const next = current.filter((id) => id !== taskId);

    await (prismadb as any).project_Opportunities.update({
      where: { id: opportunityId },
      data: { relatedTasksIDs: next },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("[OPPORTUNITY_LINK_TASK_DELETE]", e);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
