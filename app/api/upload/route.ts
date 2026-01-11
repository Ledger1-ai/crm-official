import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { BlobServiceClient } from "@azure/storage-blob";
import { getCurrentUserTeamId } from "@/lib/team-utils";

// POST /api/upload
// Generic Azure Blob upload endpoint used by Invoice FileInput and other generic uploads.
// Accepts multipart/form-data with field "file".
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const url = new URL(req.url);
    const context = url.searchParams.get("context");

    const conn = process.env.BLOB_STORAGE_CONNECTION_STRING;
    const container = process.env.BLOB_STORAGE_CONTAINER;
    if (!conn || !container) {
      return NextResponse.json({ error: "Azure Blob not configured" }, { status: 500 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Calculate SHA256 hash
    const crypto = require('crypto');
    const hashSum = crypto.createHash('sha256');
    hashSum.update(buffer);
    const hex = hashSum.digest('hex');

    // Check for existing document with same hash in this team
    const teamInfo = await getCurrentUserTeamId();
    const teamId = teamInfo?.teamId;

    const existingDoc = await (prismadb.documents as any).findFirst({
      where: {
        hash: hex,
        team_id: teamId
      }
    });

    if (existingDoc) {
      console.log("[GENERIC_UPLOAD_POST] Duplicate document found:", existingDoc.id);

      // FIX: If context is invoice, we MUST process it even if the doc exists
      // The user might be re-uploading because the previous attempt failed to create an invoice
      if (context === "invoice") {
        try {
          console.log("[GENERIC_UPLOAD_POST] Processing duplicate document for Invoice...");
          const { processInvoiceFromDocument } = await import("@/lib/invoice-processor");
          await processInvoiceFromDocument(existingDoc.id, session.user.id, teamId || null);
          console.log("[GENERIC_UPLOAD_POST] Invoice Processing Complete (Duplicate Doc).");
        } catch (err) {
          console.error("[GENERIC_UPLOAD_POST] Duplicate processing failed:", err);
          throw new Error("Invoice processing failed: " + (err as any).message);
        }
      }

      return NextResponse.json({ ok: true, document: existingDoc }, { status: 200 });
    }

    const fileNameSafe = file.name?.replace(/[^a-zA-Z0-9._-]/g, "_") || `upload_${Date.now()}`;
    const key = `uploads/${session.user.id}/${Date.now()}_${fileNameSafe}`;

    const serviceClient = BlobServiceClient.fromConnectionString(conn);
    const containerClient = serviceClient.getContainerClient(container);
    // Ensure container exists; do not change access level here
    try {
      const ensure = await containerClient.createIfNotExists();
      if (ensure.succeeded) console.log("[GENERIC_UPLOAD_POST] Container created:", container);
    } catch (e) {
      console.warn("[GENERIC_UPLOAD_POST] createIfNotExists error:", (e as any)?.message);
    }

    const blobClient = containerClient.getBlockBlobClient(key);
    console.log("[GENERIC_UPLOAD_POST] Uploading blob", { key, type: file.type, size: buffer.length });
    await blobClient.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: file.type || "application/octet-stream" },
    });
    const fileUrl = blobClient.url;
    console.log("[GENERIC_UPLOAD_POST] Uploaded blob URL:", fileUrl);

    // Create Document record (generic)
    const doc = await (prismadb.documents as any).create({
      data: {
        document_name: file.name || fileNameSafe,
        document_file_mimeType: file.type || "application/octet-stream",
        document_file_url: fileUrl,
        team_id: teamId, // Assign team
        status: "ACTIVE",
        assigned_user: session.user.id,
        key,
        size: buffer.length,
        hash: hex,
      },
    });
    console.log("[GENERIC_UPLOAD_POST] Document created:", { id: doc.id, url: doc.document_file_url });

    // Handle context-specific actions
    // Handle context-specific actions
    if (context === "invoice") {
      // Run SYNCHRONOUSLY so the client waits for the invoice to be created
      try {
        console.log("[GENERIC_UPLOAD_POST] Starting Invoice Processing...");
        const { processInvoiceFromDocument } = await import("@/lib/invoice-processor");
        await processInvoiceFromDocument(doc.id, session.user.id, teamId || null);
        console.log("[GENERIC_UPLOAD_POST] Invoice Processing Complete.");
      } catch (err) {
        console.error("[GENERIC_UPLOAD_POST] Invoice processing failed:", err);
        // We might want to return a warning, but for now strict error is safer to debug
        throw new Error("Invoice processing failed: " + (err as any).message);
      }
    }

    return NextResponse.json({ ok: true, document: doc }, { status: 201 });
  } catch (e: any) {
    console.error("[GENERIC_UPLOAD_POST]", e);
    return NextResponse.json({ error: e?.message || "Internal Error" }, { status: 500 });
  }
}
