import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

export async function GET(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await ctx.params;
    if (!projectId) return new NextResponse("Missing projectId", { status: 400 });
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    // Return default (owner null) and any user-owned sets
    const sets = await prismadb.project_Button_Sets.findMany({
      where: {
        project: projectId,
        OR: [
          { owner: null },
          userId ? { owner: userId } : { owner: undefined as any },
        ],
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ sets }, { status: 200 });
  } catch (e) {
    console.error("[BUTTON_SETS_GET]", e);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await ctx.params;
    if (!projectId) return new NextResponse("Missing projectId", { status: 400 });
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const body = await req.json().catch(() => ({}));
    const name: string = String(body?.name || "").trim();
    const config = body?.config ?? {};
    const isDefault = !!body?.isDefault;

    // If creating default, ensure requester has rights over project
    if (isDefault) {
      const project = await prismadb.boards.findUnique({ where: { id: projectId }, select: { id: true, user: true, sharedWith: true } });
      if (!project) return new NextResponse("Project not found", { status: 404 });
      const canAccess = project.user === userId || (project.sharedWith || []).includes(userId);
      if (!canAccess) return new NextResponse("Forbidden", { status: 403 });
    }

    const created = await prismadb.project_Button_Sets.create({
      data: {
        project: projectId,
        owner: isDefault ? null : userId,
        name: name || (isDefault ? "Default" : "Preset"),
        config: config as any,
        isDefault,
      },
    });
    return NextResponse.json({ set: created }, { status: 201 });
  } catch (e) {
    console.error("[BUTTON_SETS_POST]", e);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
