import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

export async function POST(req: Request, ctx: { params: Promise<{ projectId: string; setId: string }> }) {
  try {
    const { projectId, setId } = await ctx.params;
    if (!projectId || !setId) return new NextResponse("Missing projectId or setId", { status: 400 });

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    // Load the source set
    const source = await prismadb.project_Button_Sets.findUnique({
      where: { id: setId },
      select: { id: true, project: true, owner: true, name: true, config: true }
    });
    if (!source) return new NextResponse("Button set not found", { status: 404 });
    if (source.project !== projectId) return new NextResponse("Set does not belong to project", { status: 400 });

    // Verify user can access project (owner or shared)
    const project = await prismadb.boards.findUnique({
      where: { id: projectId },
      select: { id: true, user: true, sharedWith: true },
    });
    if (!project) return new NextResponse("Project not found", { status: 404 });
    const canAccess = project.user === userId || (project.sharedWith || []).includes(userId);
    if (!canAccess) return new NextResponse("Forbidden", { status: 403 });

    // If source is owned by another user, allow duplication only if it's default (owner null)
    if (source.owner && source.owner !== userId) {
      return new NextResponse("Cannot duplicate another user's preset", { status: 403 });
    }

    const newName = `Copy of ${source.name || "Preset"}`;
    const created = await prismadb.project_Button_Sets.create({
      data: {
        project: projectId,
        owner: userId,
        name: newName,
        config: (source.config ?? {}) as any,
        isDefault: false,
      },
    });

    return NextResponse.json({ set: created }, { status: 201 });
  } catch (e) {
    console.error("[BUTTON_SET_DUPLICATE_POST]", e);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
