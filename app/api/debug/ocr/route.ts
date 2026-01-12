
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BlobServiceClient } from "@azure/storage-blob";
import Tesseract from "tesseract.js";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";

// Ensure Node runtime
export const runtime = 'nodejs';

// Require lib directly to avoid index.js checks that fail in Next.js
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

export async function POST(req: Request) {
    const logs: string[] = [];
    const log = (msg: string) => { console.log(msg); logs.push(msg); };

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { blobName } = await req.json();
        if (!blobName) return NextResponse.json({ error: "No blobName provided" }, { status: 400 });

        const conn = process.env.BLOB_STORAGE_CONNECTION_STRING;
        const containerName = process.env.BLOB_STORAGE_CONTAINER;
        if (!conn || !containerName) throw new Error("Azure config missing");

        const serviceClient = BlobServiceClient.fromConnectionString(conn);
        const containerClient = serviceClient.getContainerClient(containerName);
        const blobClient = containerClient.getBlockBlobClient(blobName);

        log(`[DEBUG] Fetching blob: ${blobName}`);
        const downloadBlockBlobResponse = await blobClient.download(0);
        const arrayBuffer = await (await new Response(downloadBlockBlobResponse.readableStreamBody as any).arrayBuffer());
        const buffer = Buffer.from(arrayBuffer);

        log(`[DEBUG] Downloaded ${buffer.length} bytes.`);

        let extractedText = "";

        // 1. Try PDF Parse (text-based extraction)
        if (blobName.toLowerCase().endsWith(".pdf")) {
            try {
                log("[DEBUG] Attempting pdf-parse...");
                const pdfData = await pdfParse(buffer);
                extractedText = pdfData?.text || "";
                log(`[DEBUG] pdf-parse success. Text length: ${extractedText?.length || 0}`);
                if (extractedText) log(`[DEBUG] First 100 chars: ${extractedText.substring(0, 100).replace(/\n/g, ' ')}`);
            } catch (e: any) {
                log(`[DEBUG] pdf-parse failed: ${e.message}`);
            }
        }

        // 2. For images, try Tesseract directly
        if (!extractedText || extractedText.trim().length < 50) {
            const isImage = /\.(png|jpg|jpeg|gif|bmp|tiff|webp)$/i.test(blobName);

            if (isImage) {
                log("[DEBUG] Image file detected. Running Tesseract OCR...");
                try {
                    const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
                    extractedText = text;
                    log(`[DEBUG] OCR Text Length: ${text.length}`);
                } catch (e: any) {
                    log(`[DEBUG] Tesseract failed: ${e.message}`);
                }
            } else if (blobName.toLowerCase().endsWith(".pdf")) {
                // PDF with no text - we can't convert to images without pdf-img-convert
                // Just log that OCR is not available for scanned PDFs
                log("[DEBUG] PDF appears to be scanned (no extractable text). PDF-to-image OCR is not available.");
                log("[DEBUG] Consider uploading a text-based PDF or individual page images for OCR.");
            }
        }

        if (!extractedText || extractedText.trim().length === 0) {
            throw new Error("No text extracted. For scanned PDFs, please upload individual page images.");
        }

        // 3. Try AI Parse
        log("[DEBUG] Attempting AI Parse...");
        const InvoiceSchema = z.object({
            invoice_number: z.string().optional(),
            total_amount: z.number().optional(),
            currency: z.string().optional(),
            vendor_name: z.string().optional(),
            date: z.string().optional(),
        });

        const { object } = await generateObject({
            model: openai("gpt-4o"),
            schema: InvoiceSchema,
            prompt: `Extract invoice data from: ${extractedText.substring(0, 3000)}`,
        });

        return NextResponse.json({
            success: true,
            logs,
            extractedText: extractedText.substring(0, 1000) + "...",
            parsedData: object
        });

    } catch (error: any) {
        log(`[ERROR] ${error.message}`);
        return NextResponse.json({ success: false, logs, error: error.message }, { status: 500 });
    }
}
