import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import moduleData from "@/prisma/initial-data/system_Modules_Enabled.json";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }
  if (!session.user?.isAdmin) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const count = await prismadb.system_Modules_Enabled.count();

    if (count === 0) {
      await prismadb.system_Modules_Enabled.createMany({
        data: moduleData as any,
      });
    }

    const modules = await prismadb.system_Modules_Enabled.findMany({
      orderBy: [{ position: "asc" }],
    });

    return NextResponse.json({
      created: count === 0 ? modules.length : 0,
      modules,
    });
  } catch (error) {
    console.error("[ADMIN_INIT_MODULES]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
