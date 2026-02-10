import { prismadb } from "@/lib/prisma";
import Tesseract from "tesseract.js";

// Lazy load dependencies to prevent module load crashes
let pdfParse: any;

// Helper: Lazy load
async function loadDependencies() {
    if (!pdfParse) pdfParse = require("pdf-parse/lib/pdf-parse.js");
}


// Helper: Regex Parser (Non-AI)
function parseInvoiceFromText(text: string) {
    console.log("[INVOICE_PROCESSOR] Using Improved Regex Parser v2");
    const result: any = {};

    // 1. EXTRACT TOTAL
    // Strategy: Look for "Total", "Balance Due", "Amount Due" followed by a currency-like number.
    // The previous logic failed because it grabbed the first number. 
    // This logic grabs ALL matches for "Total" and picks the LARGEST one.

    // Regex matches: "Total" ... "$11,459.77"
    const totalLabelRegex = /(?:Total|Balance Due|Amount Due|Invoice Total|Grand Total)[\s\S]{0,50}?[$€£]?\s*([0-9,]+\.[0-9]{2})/gi;
    let totalMatch;
    let maxLabelVal = 0;

    while ((totalMatch = totalLabelRegex.exec(text)) !== null) {
        const valStr = totalMatch[1].replace(/,/g, '');
        const val = parseFloat(valStr);
        if (!isNaN(val) && val > maxLabelVal) {
            maxLabelVal = val;
            result.invoice_amount = totalMatch[1]; // Store original formatting (e.g. 11,459.77)
        }
    }

    // If no labeled total found, or if it looks suspicious, scan for the largest number in the doc (Fallback)
    if (!result.invoice_amount) {
        const generalAmountRegex = /[$€£]\s*([0-9,]+\.[0-9]{2})/g;
        let amntMatch;
        let maxGenVal = 0;
        while ((amntMatch = generalAmountRegex.exec(text)) !== null) {
            const val = parseFloat(amntMatch[1].replace(/,/g, ''));
            if (val > maxGenVal) {
                maxGenVal = val;
                result.invoice_amount = amntMatch[1];
            }
        }
    }


    // 2. EXTRACT DATE
    // Explicit priority: "Invoice Date" followed by YYYY-MM-DD
    const dateYMDRegex = /(?:Invoice date|Date|Dated)[\s\S]{0,20}?(\d{4}-\d{2}-\d{2})/i;
    const directMatch = text.match(dateYMDRegex);

    if (directMatch) {
        result.date_received = directMatch[1];
    } else {
        // Fallback 1: Any YYYY-MM-DD
        const anyYMD = text.match(/(\d{4}-\d{2}-\d{2})/);
        if (anyYMD) {
            result.date_received = anyYMD[1];
        } else {
            // Fallback 2: DD.MM.YYYY
            const dmyRegex = /(\d{1,2}\.\d{1,2}\.\d{4})/;
            const dmyMatch = text.match(dmyRegex);
            if (dmyMatch) {
                // Convert to YYYY-MM-DD
                const parts = dmyMatch[1].split('.');
                if (parts.length === 3) {
                    result.date_received = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
            }
        }
    }

    // 3. Currency guess - Defaulting to USD as requested
    if (text.includes("GBP") || text.includes("£")) result.invoice_currency = "GBP";
    else if (text.includes("EUR") || text.includes("€")) result.invoice_currency = "USD"; // User requested USD across the app
    else result.invoice_currency = "USD"; // Default

    // 4. Vendor Name guess
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
        result.vendor_name = emailMatch[1].split('.')[0].toUpperCase();
    } else {
        const firstLine = text.trim().split('\n')[0];
        if (firstLine && firstLine.length < 50) {
            result.vendor_name = firstLine;
        }
    }

    return result;
}


// Function to process a document and create an invoice
export async function processInvoiceFromDocument(
    documentId: string,
    userId: string,
    teamId: string | null
) {
    try {
        await loadDependencies();
        console.log(`[INVOICE_PROCESSOR] Processing document ${documentId}`);

        const document = await prismadb.documents.findUnique({
            where: { id: documentId },
        });

        if (!document) {
            throw new Error("Document not found");
        }

        let extractedText = "";

        // 1. Extract text based on file type
        if (document.document_file_mimeType === "application/pdf") {
            try {
                console.log("[INVOICE_PROCESSOR] Attempting pdf-parse...");
                const response = await fetch(document.document_file_url);
                if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);

                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const pdfData = await pdfParse(buffer);
                extractedText = pdfData?.text || "";
                console.log(`[INVOICE_PROCESSOR] pdf-parse extracted ${extractedText.length} characters.`);
            } catch (err) {
                console.warn("[INVOICE_PROCESSOR] pdf-parse failed:", err);
            }
        }

        // Tesseract Fallback for images
        if (!extractedText || extractedText.trim().length < 50 || document.document_file_mimeType.startsWith("image/")) {
            console.log("[INVOICE_PROCESSOR] Running Tesseract OCR...");
            let imagesToScan: Buffer[] = [];

            if (document.document_file_mimeType === "application/pdf") {
                // PDF with no text - we can't convert to images without native canvas
                // Log that OCR is not available for scanned PDFs
                console.warn("[INVOICE_PROCESSOR] PDF appears to be scanned (no extractable text). PDF-to-image OCR is not available.");
                console.warn("[INVOICE_PROCESSOR] Consider uploading individual page images for OCR processing.");
            } else if (document.document_file_mimeType.startsWith("image/")) {
                const response = await fetch(document.document_file_url);
                const arrayBuffer = await response.arrayBuffer();
                imagesToScan = [Buffer.from(arrayBuffer)];
            }

            for (const imgBuffer of imagesToScan) {
                try {
                    const { data: { text } } = await Tesseract.recognize(imgBuffer, 'eng');
                    extractedText += "\n" + text;
                } catch (tessErr) {
                    console.warn("[INVOICE_PROCESSOR] Tesseract failed on image page:", tessErr);
                }
            }
        }

        const parsedData = parseInvoiceFromText(extractedText);
        console.log("[INVOICE_PROCESSOR] Parsed Data:", parsedData);

        const invoice = await prismadb.invoices.create({
            data: {
                invoice_number: undefined,
                invoice_amount: parsedData.invoice_amount || undefined,
                invoice_currency: parsedData.invoice_currency || "USD",
                date_received: parsedData.date_received ? new Date(parsedData.date_received) : new Date(),
                // Date Due matches Date Received to ensure valid Date object in UI
                date_due: parsedData.date_received ? new Date(parsedData.date_received) : new Date(),
                description: `Invoice from ${parsedData.vendor_name || 'Unknown'} (Processed by OCR)`,
                partner: parsedData.vendor_name,
                invoice_file_mimeType: document.document_file_mimeType,
                invoice_file_url: document.document_file_url,
                status: "NEW",
                assigned_user_id: userId,
                team_id: teamId,
                connected_documents: [document.id],
            }
        });

        await prismadb.documents.update({
            where: { id: document.id },
            data: {
                invoiceIDs: { push: invoice.id }
            }
        });

        console.log("[INVOICE_PROCESSOR] Invoice created successfully:", invoice.id);
        return invoice;

    } catch (error) {
        console.error("[INVOICE_PROCESSOR] Fatal Error processing invoice:", error);
        throw error;
    }
}
