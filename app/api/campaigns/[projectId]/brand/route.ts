import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

export async function PATCH(req: Request, props: { params: Promise<{ projectId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthenticated", { status: 401 });
  const body = await req.json().catch(() => ({}));
  const logo = typeof body?.brand_logo_url === "string" ? body.brand_logo_url : undefined;
  const color = typeof body?.brand_primary_color === "string" ? body.brand_primary_color : undefined;
  if (!logo && !color) return new NextResponse("No brand fields provided", { status: 400 });

  try {
    // Ensure user can access/update the board
    const board = await (prismadb as any).boards.findUnique({ where: { id: params.projectId }, select: { id: true, user: true, sharedWith: true } });
    if (!board) return new NextResponse("Project not found", { status: 404 });
    const canAccess = board.user === session.user.id || (board.sharedWith || []).includes(session.user.id);
    if (!canAccess) return new NextResponse("Forbidden", { status: 403 });

    const data: any = {};
    if (logo !== undefined) data.brand_logo_url = logo;
    if (color !== undefined) data.brand_primary_color = color;

    await (prismadb as any).boards.update({ where: { id: params.projectId }, data });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("[PROJECT_BRAND_PATCH]", e);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request, props: { params: Promise<{ projectId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthenticated", { status: 401 });
  try {
    const board = await (prismadb as any).boards.findUnique({ where: { id: params.projectId }, select: { id: true, brand_logo_url: true, brand_primary_color: true } });
    if (!board) return new NextResponse("Project not found", { status: 404 });
    return NextResponse.json({ brand_logo_url: board.brand_logo_url, brand_primary_color: board.brand_primary_color }, { status: 200 });
  } catch (e) {
    console.error("[PROJECT_BRAND_GET]", e);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
