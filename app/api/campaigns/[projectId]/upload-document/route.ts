import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getBlobServiceClient } from "@/lib/azure-storage";

// POST /api/campaigns/[projectId]/upload-document
// Accepts multipart/form-data { file } and uploads to Azure Blob Storage,
// creates a "Documents" section and task if needed, and attaches a Document record.
export async function POST(req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await ctx.params;
    if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const conn = process.env.BLOB_STORAGE_CONNECTION_STRING;
    const container = process.env.BLOB_STORAGE_CONTAINER;
    if (!conn || !container) {
      return NextResponse.json({ error: "Azure Blob not configured" }, { status: 500 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileNameSafe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `projects/${projectId}/${Date.now()}_${fileNameSafe}`;

    // Upload to Azure Blob
    const serviceClient = getBlobServiceClient();
    const containerClient = serviceClient.getContainerClient(container);
    const blobClient = containerClient.getBlockBlobClient(key);
    await blobClient.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: file.type || "application/octet-stream" },
    });
    const fileUrl = blobClient.url; // accessible if container is public or via SAS if configured elsewhere

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

    // Create a task to anchor the document
    const task = await prismadb.tasks.create({
      data: {
        title: file.name,
        content: null,
        position: 0,
        priority: "Normal",
        section: docsSection.id,
        user: session.user.id,
        v: 0,
      },
      select: { id: true },
    });

    // Create the document record and attach to the task
    const doc = await prismadb.documents.create({
      data: {
        document_name: file.name,
        document_file_mimeType: file.type || "application/octet-stream",
        document_file_url: fileUrl,
        status: "ACTIVE",
        assigned_user: session.user.id,
        tasksIDs: [task.id],
      },
    });

    return NextResponse.json({ ok: true, document: doc }, { status: 201 });
  } catch (e: any) {
    console.error("[PROJECT_UPLOAD_DOCUMENT_POST]", e);
    return NextResponse.json({ error: e?.message || "Internal Error" }, { status: 500 });
  }
}
