import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadbChat } from "@/lib/prisma-chat";
const db: any = prismadbChat;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const sessions = await db.chat_Sessions.findMany({
      where: { user: session.user.id },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ sessions }, { status: 200 });
  } catch (error) {
    console.error("[CHAT_SESSIONS_GET]", error);
    return new NextResponse("Failed to fetch sessions", { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, isTemporary } = body || {};

    const created = await db.chat_Sessions.create({
      data: {
        user: session.user.id,
        title: title ?? "New Chat",
        isTemporary: Boolean(isTemporary),
      },
    });

    return NextResponse.json({ session: created }, { status: 201 });
  } catch (error) {
    console.error("[CHAT_SESSIONS_POST]", error);
    return new NextResponse("Failed to create session", { status: 500 });
  }
}
