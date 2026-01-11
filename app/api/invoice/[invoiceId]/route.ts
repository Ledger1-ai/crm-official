import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

//Get single invoice data
export async function GET(request: Request, props: { params: Promise<{ invoiceId: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ status: 401, body: { error: "Unauthorized" } });
  }

  const { invoiceId } = await props.params;

  if (!invoiceId) {
    return NextResponse.json({
      status: 400,
      body: { error: "Bad Request - invoice id is mandatory" },
    });
  }

  const invoice = await prismadb.invoices.findFirst({
    where: {
      id: invoiceId,
    },
  });

  if (!invoice) {
    return NextResponse.json({
      status: 404,
      body: { error: "Invoice not found" },
    });
  }

  return NextResponse.json({ invoice }, { status: 200 });
}

//Delete single invoice by invoiceId
export async function DELETE(request: Request, props: { params: Promise<{ invoiceId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ status: 401, body: { error: "Unauthorized" } });
  }

  const { invoiceId } = await props.params;

  if (!invoiceId) {
    return NextResponse.json({
      status: 400,
      body: { error: "Bad Request - invoice id is mandatory" },
    });
  }

  const invoiceData = await prismadb.invoices.findFirst({
    where: {
      id: invoiceId,
    },
  });

  if (!invoiceData) {
    return NextResponse.json({
      status: 404,
      body: { error: "Invoice not found" },
    });
  }

  try {
    // 1. Attempt to delete from Azure Blob Storage (Best Effort)
    // We wrap this in a try/catch so that file storage errors DO NOT block the DB deletion.
    if (invoiceData?.invoice_file_url) {
      try {
        // Lazy load the Azure client to avoid top-level dependency issues
        const { BlobServiceClient } = require("@azure/storage-blob");
        const connectionString = process.env.BLOB_STORAGE_CONNECTION_STRING;
        const containerName = process.env.BLOB_STORAGE_CONTAINER;

        if (connectionString && containerName) {
          const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
          const containerClient = blobServiceClient.getContainerClient(containerName);

          // Naive logic: Extract blob name from URL
          // URL: https://<account>.blob.core.windows.net/<container>/<blobName>
          const parts = invoiceData.invoice_file_url.split('/');
          const blobName = parts[parts.length - 1];

          if (blobName) {
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);
            await blockBlobClient.deleteIfExists();
            console.log("[DELETE] Deleted blob from Azure:", blobName);
          }
        } else {
          console.warn("[DELETE] Missing Azure config, skipping file delete.");
        }
      } catch (fileErr) {
        console.error("[DELETE] Failed to delete file from Azure (non-fatal):", fileErr);
      }
    }

    // 2. Delete invoice from database (CRITICAL priority)
    const invoice = await prismadb.invoices.delete({
      where: {
        id: invoiceId,
      },
    });
    console.log("[DELETE] Invoice deleted from database:", invoiceId);

    return NextResponse.json({ invoice }, { status: 200 });
  } catch (err: any) {
    console.error("[DELETE] Error:", err);
    return NextResponse.json(
      { error: err.message || "Something went wrong while deleting invoice" },
      { status: 500 }
    );
  }
}
