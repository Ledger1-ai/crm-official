import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadbCrm } from "@/lib/prisma-crm";
import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";

// PATCH /api/leads/pools/[poolId]/assign-button-set
// Body: { projectId: string, buttonSetId: string }
// Writes to pool.icpConfig: { assignedProjectId, assignedButtonSetId }
export async function PATCH(req: Request, context: { params: Promise<{ poolId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { poolId } = await context.params;
    if (!poolId) return new NextResponse("Missing poolId", { status: 400 });

    const teamInfo = await getCurrentUserTeamId();
    const teamId = teamInfo?.teamId;
    const isTeamAdmin = teamInfo?.isAdmin;

    const body = await req.json().catch(() => ({}));
    const projectId = String(body?.projectId || "").trim();
    const buttonSetId = String(body?.buttonSetId || "").trim();
    if (!projectId) return new NextResponse("Missing projectId", { status: 400 });
    if (!buttonSetId) return new NextResponse("Missing buttonSetId", { status: 400 });

    // Validate pool ownership or Admin
    const pool = await (prismadbCrm as any).crm_Lead_Pools.findUnique({
      where: { id: poolId },
      select: { id: true, user: true, team_id: true, icpConfig: true },
    });
    if (!pool) return new NextResponse("Pool not found", { status: 404 });

    const isPoolOwner = pool.user === userId;
    const isPoolTeamAdmin = Boolean(isTeamAdmin && teamId && pool.team_id === teamId);

    if (!isPoolOwner && !isPoolTeamAdmin) return new NextResponse("Forbidden", { status: 403 });

    // Validate project access
    const project = await prismadb.boards.findUnique({
      where: { id: projectId },
      select: { id: true, user: true, sharedWith: true, team_id: true, visibility: true },
    });
    if (!project) return new NextResponse("Project not found", { status: 404 });

    const isProjectOwner = project.user === userId;
    const isProjectShared = (project.sharedWith || []).includes(userId);
    const isTeamPublic = !!(teamId && project.team_id === teamId && project.visibility === "public");

    const canAccessProject = isProjectOwner || isProjectShared || isTeamPublic;
    if (!canAccessProject) return new NextResponse("Forbidden", { status: 403 });

    // Validate button set belongs to project and is accessible
    const buttonSet = await prismadb.project_Button_Sets.findUnique({
      where: { id: buttonSetId },
      select: { id: true, project: true, owner: true },
    });
    if (!buttonSet) return new NextResponse("Button set not found", { status: 404 });
    if (buttonSet.project !== projectId) return new NextResponse("Button set does not belong to project", { status: 400 });
    const canUseSet = buttonSet.owner === null || buttonSet.owner === userId;
    if (!canUseSet) return new NextResponse("Forbidden", { status: 403 });

    const nextConfig = {
      ...(pool.icpConfig || {}),
      assignedProjectId: projectId,
      assignedButtonSetId: buttonSetId,
    };

    await (prismadbCrm as any).crm_Lead_Pools.update({
      where: { id: poolId },
      data: { icpConfig: nextConfig as any },
    });

    return NextResponse.json({ ok: true, icpConfig: nextConfig }, { status: 200 });
  } catch (e) {
    console.error("[ASSIGN_BUTTON_SET_PATCH]", e);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
