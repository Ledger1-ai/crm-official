
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BlobServiceClient } from "@azure/storage-blob";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export const runtime = 'nodejs';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const conn = process.env.BLOB_STORAGE_CONNECTION_STRING;
        const containerName = process.env.BLOB_STORAGE_CONTAINER;

        if (!conn || !containerName) {
            return NextResponse.json({ error: "Azure Blob not configured" }, { status: 500 });
        }

        const serviceClient = BlobServiceClient.fromConnectionString(conn);
        const containerClient = serviceClient.getContainerClient(containerName);

        const blobs = [];
        // List blobs, limit to 20
        let iter = containerClient.listBlobsFlat({ includeMetadata: true });
        let count = 0;
        for await (const blob of iter) {
            if (count >= 20) break;
            blobs.push({
                name: blob.name,
                created: blob.properties.createdOn,
                size: blob.properties.contentLength,
                type: blob.properties.contentType
            });
            count++;
        }

        // Sort by created desc
        blobs.sort((a, b) => (b.created && a.created ? b.created.valueOf() - a.created.valueOf() : 0));

        return NextResponse.json({ blobs: blobs.slice(0, 50) });
    } catch (error: any) {
        console.error("[DEBUG_BLOB_LIST_ERROR]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
