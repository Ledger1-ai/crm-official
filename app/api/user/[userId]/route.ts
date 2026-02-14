import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prismadb } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/actions/audit";

export async function GET(req: Request, props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  try {
    const user = await prismadb.users.findMany({
      where: {
        id: params.userId,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.log("[USER_GET]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  try {
    // Manually handle common user relations to avoid P2014 constraint issues
    await prismadb.projectMember.deleteMany({ where: { user: params.userId } });
    await prismadb.systemActivity.deleteMany({ where: { userId: params.userId } });
    await prismadb.notification.deleteMany({ where: { userId: params.userId } });
    await prismadb.dashboardPreference.deleteMany({ where: { userId: params.userId } });

    const user = await prismadb.users.delete({
      where: {
        id: params.userId,
      },
    });

    await logActivity(
      "Deleted User",
      "User Management",
      `Deleted user ${user.email} (${user.name})`
    );

    return NextResponse.json(user);
  } catch (error) {
    console.log("[USER_DELETE]", error);
    return NextResponse.json({ message: error }, { status: 500 });
  }
}
