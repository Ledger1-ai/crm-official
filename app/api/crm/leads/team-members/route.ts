import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadbCrm } from "@/lib/prisma-crm";
import { prismadb } from "@/lib/prisma";

/**
 * GET /api/leads/team-members
 * Returns list of active team members for assignment with persistent colors
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const baseUsersQuery = {
      where: { userStatus: "ACTIVE" },
      select: { id: true, name: true, email: true, avatar: true },
      orderBy: { name: "asc" as const },
    };

    // Determine admin from primary DB flags
    const me = await prismadb.users.findUnique({
      where: { id: session.user.id },
      select: { is_admin: true, is_account_admin: true },
    });
    const isAdmin = !!(me?.is_admin || me?.is_account_admin);

    let users;
    if (isAdmin) {
      users = await (prismadbCrm as any).Users.findMany(baseUsersQuery);
    } else {
      const self = await (prismadbCrm as any).Users.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true, avatar: true },
      });
      users = self ? [self] : [];
    }

    // Assign persistent colors based on user ID hash
    const colors = [
      "#3b82f6", // blue
      "#10b981", // green
      "#f59e0b", // amber
      "#ef4444", // red
      "#8b5cf6", // purple
      "#ec4899", // pink
      "#06b6d4", // cyan
      "#f97316", // orange
      "#84cc16", // lime
      "#6366f1", // indigo
    ];

    const usersWithColors = users.map((user: any) => {
      // Hash user ID to get consistent color index
      const hash = user.id.split("").reduce((acc: number, char: string) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
      }, 0);
      const colorIndex = Math.abs(hash) % colors.length;

      return {
        ...user,
        color: colors[colorIndex],
      };
    });

    return NextResponse.json({ users: usersWithColors, isAdmin }, { status: 200 });
  } catch (error) {
    console.error("[TEAM_MEMBERS_GET]", error);
    return new NextResponse("Failed to fetch team members", { status: 500 });
  }
}
