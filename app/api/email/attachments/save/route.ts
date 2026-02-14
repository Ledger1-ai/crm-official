import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGmailClientForUser } from "@/lib/gmail";
import { getGraphClient } from "@/lib/microsoft";
import { prismadb } from "@/lib/prisma";
import { getBlobServiceClient } from "@/lib/azure-storage";
import { getCurrentUserTeamId } from "@/lib/team-utils";

/**
 * POST /api/email/attachments/save
 * Fetches an email attachment and saves it to the CRM document store.
 */
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { attachmentId, messageId, filename, mimeType, provider, leadId, contactId, accountId } = await req.json();

        if (!attachmentId || !messageId || !provider) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        let buffer: Buffer;

        if (provider === "gmail") {
            const gmail = await getGmailClientForUser(session.user.id);
            if (!gmail) return new NextResponse("Gmail not connected", { status: 400 });

            const resp = await gmail.users.messages.attachments.get({
                userId: "me",
                messageId,
                id: attachmentId
            });

            const data = resp.data.data;
            if (!data) throw new Error("No attachment data found");
            buffer = Buffer.from(data, "base64");
        } else if (provider === "outlook") {
            const client = await getGraphClient(session.user.id);
            if (!client) return new NextResponse("Microsoft not connected", { status: 400 });

            const attachment = await client.api(`/me/messages/${messageId}/attachments/${attachmentId}`).get();
            if (!attachment.contentBytes) throw new Error("No attachment content found");
            buffer = Buffer.from(attachment.contentBytes, "base64");
        } else {
            return new NextResponse("Invalid provider", { status: 400 });
        }

        // Upload to Azure Blob
        const conn = process.env.BLOB_STORAGE_CONNECTION_STRING;
        const container = process.env.BLOB_STORAGE_CONTAINER;
        if (!conn || !container) throw new Error("Azure Blob not configured");

        const fileNameSafe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
        const key = `documents/${session.user.id}/email_attach_${Date.now()}_${fileNameSafe}`;

        const serviceClient = getBlobServiceClient();
        const containerClient = serviceClient.getContainerClient(container);
        const blobClient = containerClient.getBlockBlobClient(key);

        await blobClient.uploadData(buffer, {
            blobHTTPHeaders: { blobContentType: mimeType || "application/octet-stream" },
        });

        const fileUrl = blobClient.url;
        const teamInfo = await getCurrentUserTeamId();

        // Create document record
        const doc = await (prismadb.documents as any).create({
            data: {
                document_name: filename,
                document_file_mimeType: mimeType || "application/octet-stream",
                document_file_url: fileUrl,
                team_id: teamInfo?.teamId,
                status: "ACTIVE",
                assigned_user: session.user.id,
                createdBy: session.user.id,
                key,
                size: buffer.length,
                leadsIDs: leadId ? [leadId] : [],
                contactsIDs: contactId ? [contactId] : [],
                accountsIDs: accountId ? [accountId] : [],
                document_system_type: "OTHER"
            }
        });

        return NextResponse.json({ ok: true, document: doc });

    } catch (error: any) {
        console.error("[SAVE_EMAIL_ATTACHMENT]", error);
        return new NextResponse(error.message || "Failed to save attachment", { status: 500 });
    }
}
