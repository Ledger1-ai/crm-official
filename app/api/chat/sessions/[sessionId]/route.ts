import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadbChat } from "@/lib/prisma-chat";
import { prismadb } from "@/lib/prisma";

const db: any = prismadbChat;

type Params = {
  params: Promise<{ sessionId: string }>;
};

// Helper to check access
async function checkAccess(sessionUserId: string, targetUserId: string) {
  if (sessionUserId === targetUserId) return true;

  const currentUser = await prismadb.users.findUnique({
    where: { id: sessionUserId },
    select: { id: true, team_id: true, is_admin: true, team_role: true },
  });

  const isAdmin = currentUser?.is_admin || currentUser?.team_role === "OWNER" || currentUser?.team_role === "ADMIN";
  if (!isAdmin || !currentUser?.team_id) return false;

  const targetUser = await prismadb.users.findUnique({
    where: { id: targetUserId },
    select: { team_id: true },
  });

  return targetUser?.team_id === currentUser.team_id;
}

// GET /api/chat/sessions/:sessionId - fetch a single session with messages count
export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { sessionId } = await params;

  try {
    const data = await db.chat_Sessions.findUnique({
      where: { id: sessionId },
    });

    if (!data) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const hasAccess = await checkAccess(session.user.id, data.user);
    if (!hasAccess) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const messagesCount = await db.chat_Messages.count({
      where: { session: sessionId },
    });

    return NextResponse.json({ session: data, messagesCount }, { status: 200 });
  } catch (error) {
    console.error("[CHAT_SESSION_GET]", error);
    return new NextResponse("Failed to fetch session", { status: 500 });
  }
}

// PATCH /api/chat/sessions/:sessionId - update title / isTemporary
export async function PATCH(req: Request, { params }: Params) {
  const auth = await getServerSession(authOptions);
  if (!auth) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { sessionId } = await params;

  try {
    const payload = await req.json();
    const { title, isTemporary } = payload || {};

    const existing = await db.chat_Sessions.findUnique({
      where: { id: sessionId },
    });

    if (!existing) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const hasAccess = await checkAccess(auth.user.id, existing.user);
    if (!hasAccess) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const updated = await db.chat_Sessions.update({
      where: { id: sessionId },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(isTemporary !== undefined ? { isTemporary: Boolean(isTemporary) } : {}),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ session: updated }, { status: 200 });
  } catch (error) {
    console.error("[CHAT_SESSION_PATCH]", error);
    return new NextResponse("Failed to update session", { status: 500 });
  }
}

// DELETE /api/chat/sessions/:sessionId - delete session and all its messages
export async function DELETE(_req: Request, { params }: Params) {
  const auth = await getServerSession(authOptions);
  if (!auth) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { sessionId } = await params;

  try {
    const existing = await db.chat_Sessions.findUnique({
      where: { id: sessionId },
    });

    if (!existing) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const hasAccess = await checkAccess(auth.user.id, existing.user);
    if (!hasAccess) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // 1. Break parent-child relationships (self-referential constraint)
    // We must unlink children before we can delete the parents bc of NoAction/NoAction
    await db.chat_Messages.updateMany({
      where: { session: sessionId },
      data: { parent: null },
    });

    // 2. Delete all messages
    await db.chat_Messages.deleteMany({
      where: { session: sessionId },
    });

    // Delete the session
    await db.chat_Sessions.delete({
      where: { id: sessionId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[CHAT_SESSION_DELETE]", error);
    return NextResponse.json({ error: `Failed to delete session: ${(error as Error).message}` }, { status: 500 });
  }
}
