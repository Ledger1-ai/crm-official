import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, props: { params: Promise<{ taskId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  const { taskId } = params;

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  if (!taskId) {
    return new NextResponse("Missing task id", { status: 400 });
  }

  try {
    const task = await prismadb.tasks.findUnique({
      where: { id: taskId },
      include: { assigned_section: true }
    });

    if (!task) {
      return new NextResponse("Task not found", { status: 404 });
    }

    const boardId = task.assigned_section?.board;
    let targetSectionId = task.section;

    if (boardId) {
      const sections = await prismadb.sections.findMany({
        where: { board: boardId },
        orderBy: { position: "asc" }
      });

      const completeSection = sections.find(s =>
        s.title.toLowerCase().includes("complete") ||
        s.title.toLowerCase().includes("done")
      );

      if (completeSection) {
        targetSectionId = completeSection.id;
      }
    }

    await prismadb.tasks.update({
      where: {
        id: taskId,
      },
      data: {
        taskStatus: "COMPLETE",
        section: targetSectionId,
        updatedBy: session.user.id,
      },
    });

    return NextResponse.json({ status: 200 });
  } catch (error) {
    console.log("[NEW_TASK_IN_PROJECT_POST]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}
