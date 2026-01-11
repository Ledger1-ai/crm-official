
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

// Polyfill Canvas/Image/DOMMatrix for pdfjs-dist (used by pdf-img-convert)
// MUST run before requiring pdf-img-convert
// We are in Node runtime, so we can unconditionally polyfill
{
    try {
        const customCanvas = require('canvas');
        (global as any).Canvas = customCanvas.Canvas;
        (global as any).Image = customCanvas.Image;
        (global as any).ImageData = customCanvas.ImageData;
        (global as any).DOMMatrix = customCanvas.DOMMatrix;
    } catch (e) {
        console.warn("Canvas polyfill failed:", e);
    }
}

const pdf2img = require("pdf-img-convert");
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

        // 1. Try PDF Parse
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

        // 2. Try Tesseract if needed
        if (!extractedText || extractedText.trim().length < 50) {
            log("[DEBUG] Text short/empty. Attempting Tesseract (Canvas required)...");
            try {
                log("[DEBUG] Converting PDF to images...");
                // Only first page for debug speed
                const outputImages = await pdf2img.convert(buffer, { page_numbers: [1], base64: false });
                const imagesToScan = outputImages.map((img: any) => Buffer.from(img));
                log(`[DEBUG] Converted to ${imagesToScan.length} images.`);

                for (const imgBuffer of imagesToScan) {
                    log("[DEBUG] Running Tesseract.recognize...");
                    const { data: { text } } = await Tesseract.recognize(imgBuffer, 'eng');
                    extractedText += "\n" + text;
                    log(`[DEBUG] OCR Page Text Length: ${text.length}`);
                }
            } catch (e: any) {
                log(`[DEBUG] Tesseract/Conversion failed: ${e.message}`);
                log(`[DEBUG] Stack: ${e.stack}`);
            }
        }

        if (!extractedText || extractedText.trim().length === 0) {
            throw new Error("No text extracted from either method.");
        }

        // 3. Try AI Parse (Optional, just to show it works)
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
