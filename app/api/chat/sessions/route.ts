import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadbChat } from "@/lib/prisma-chat";
import { prismadb } from "@/lib/prisma";

const db: any = prismadbChat;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // 1. Fetch full user to check usage role/team
    const user = await prismadb.users.findUnique({
      where: { id: session.user.id },
      select: { id: true, team_id: true, is_admin: true, team_role: true },
    });

    let whereClause: any = { user: session.user.id };

    // 2. Check if Admin/Owner wanting to see Team Chats
    // For now, let's filter by query param ?view=team if implemented, or just default to showing all if admin?
    // User requested "Admins to have oversight". Let's fetch ALL team sessions if admin.
    const isAdmin = user?.is_admin || user?.team_role === "OWNER" || user?.team_role === "ADMIN";

    if (isAdmin && user?.team_id) {
      // Find all users in this team
      const teamMembers = await prismadb.users.findMany({
        where: { team_id: user.team_id },
        select: { id: true },
      });
      const memberIds = teamMembers.map((m) => m.id);
      whereClause = { user: { in: memberIds } };
    }

    const sessions = await db.chat_Sessions.findMany({
      where: whereClause,
      orderBy: { updatedAt: "desc" },
      include: {
        assigned_user: { // Include basic info to show who owns the chat
          select: { name: true, email: true, avatar: true }
        }
      }
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
