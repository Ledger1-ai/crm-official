import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadbChat } from "@/lib/prisma-chat";
const db: any = prismadbChat;

type Params = {
  params: Promise<{ sessionId: string }>;
};

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

    if (!data || data.user !== session.user.id) {
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

    if (!existing || existing.user !== auth.user.id) {
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

    if (!existing || existing.user !== auth.user.id) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Delete messages first (Mongo won't cascade)
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
    return new NextResponse("Failed to delete session", { status: 500 });
  }
}
