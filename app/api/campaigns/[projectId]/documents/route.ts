import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

// GET /api/campaigns/[projectId]/documents
// Returns documents connected to tasks within sections of the given project (board)
export async function GET(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { projectId } = await ctx.params;
    if (!projectId) return new NextResponse("Missing projectId", { status: 400 });

    // Find sections for the project (board)
    const sections = await prismadb.sections.findMany({
      where: { board: projectId },
      select: { id: true },
    });
    const sectionIds = sections.map(s => s.id);

    // Find tasks within those sections
    const tasks = await prismadb.tasks.findMany({
      where: { section: { in: sectionIds } },
      select: { id: true },
    });
    const taskIds = tasks.map(t => t.id);

    // Fetch documents attached to those tasks
    const documents = await prismadb.documents.findMany({
      where: { tasksIDs: { hasSome: taskIds } },
      include: { assigned_to_user: true },
      orderBy: { createdAt: "desc" as any },
    });

    return NextResponse.json({ documents }, { status: 200 });
  } catch (e) {
    console.error("[PROJECT_DOCUMENTS_GET]", e);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST /api/campaigns/[projectId]/documents
// Assign an existing unassigned document to the given project by creating/using the "Documents" section and a task anchor
export async function POST(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { projectId } = await ctx.params;
    if (!projectId) return new NextResponse("Missing projectId", { status: 400 });

    const body = await req.json();
    const { documentId } = body as { documentId?: string };
    if (!documentId) return new NextResponse("Missing documentId", { status: 400 });

    // Verify document exists
    const existingDoc = await prismadb.documents.findUnique({
      where: { id: documentId },
      select: { id: true, document_name: true, tasksIDs: true },
    });
    if (!existingDoc) return new NextResponse("Document not found", { status: 404 });

    // Ensure a "Documents" section exists for this project
    let docsSection = await prismadb.sections.findFirst({
      where: { board: projectId, title: "Documents" },
      select: { id: true },
    });
    if (!docsSection) {
      docsSection = await prismadb.sections.create({
        data: { board: projectId, title: "Documents", position: 0, v: 0 },
        select: { id: true },
      });
    }

    // Create a task to anchor the document (or reuse? For simplicity, create a new task)
    const task = await prismadb.tasks.create({
      data: {
        title: existingDoc.document_name,
        content: null,
        position: 0,
        priority: "Normal",
        section: docsSection.id,
        user: session.user.id,
        v: 0,
      },
      select: { id: true },
    });

    // Attach the task to the document
    const currentTasks = Array.isArray((existingDoc as any).tasksIDs)
      ? ((existingDoc as any).tasksIDs as string[])
      : [];
    const updatedTasks = currentTasks.includes(task.id)
      ? currentTasks
      : [...currentTasks, task.id];

    const updatedDoc = await prismadb.documents.update({
      where: { id: existingDoc.id },
      data: {
        tasksIDs: updatedTasks,
        assigned_user: session.user.id,
      },
    });

    return NextResponse.json({ ok: true, document: updatedDoc }, { status: 200 });
  } catch (e) {
    console.error("[PROJECT_DOCUMENTS_POST_ASSIGN]", e);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
