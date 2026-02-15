import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

// PATCH: update an existing button set's name/config
export async function PATCH(req: Request, ctx: { params: Promise<{ projectId: string; setId: string }> }) {
  try {
    const { projectId, setId } = await ctx.params;
    if (!projectId || !setId) return new NextResponse("Missing projectId or setId", { status: 400 });

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json().catch(() => ({}));
    const name: string | undefined = body?.name ? String(body.name).trim() : undefined;
    const config: any = body?.config ?? undefined;

    // Load set and project
    const set = await prismadb.project_Button_Sets.findUnique({
      where: { id: setId },
      select: { id: true, project: true, owner: true, isDefault: true, name: true }
    });
    if (!set) return new NextResponse("Button set not found", { status: 404 });
    if (set.project !== projectId) return new NextResponse("Set does not belong to project", { status: 400 });

    const project = await prismadb.boards.findUnique({
      where: { id: projectId },
      select: { id: true, user: true, sharedWith: true },
    });
    if (!project) return new NextResponse("Project not found", { status: 404 });
    const canAccessProject = project.user === userId || (project.sharedWith || []).includes(userId);

    // Authorization: allow updating own presets; allow updating default if project access
    if (set.owner && set.owner !== userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    if (!set.owner && !canAccessProject) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const updated = await prismadb.project_Button_Sets.update({
      where: { id: setId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(config !== undefined ? { config } : {}),
      },
    });

    return NextResponse.json({ set: updated }, { status: 200 });
  } catch (e) {
    console.error("[BUTTON_SET_UPDATE_PATCH]", e);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
