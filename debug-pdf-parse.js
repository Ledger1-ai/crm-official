const fs = require('fs');
const pdf = require('pdf-parse');

const dummyBuffer = Buffer.from("%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 12 >>\nstream\nHello World\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000125 00000 n \n0000000220 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n282\n%%EOF");

async function test() {
    console.log("Keys found:", Object.keys(pdf));

    // Test 1: pdf.default
    if (pdf.default) {
        console.log("\n--- Testing pdf.default(buffer) ---");
        try {
            const data = await pdf.default(dummyBuffer);
            console.log("Success! Text:", data.text);
            return;
        } catch (e) {
            console.log("Failed:", e.message);
        }
    } else {
        console.log("pdf.default is undefined");
    }

    // Test 2: pdf.PDFParse (as function)
    if (pdf.PDFParse) {
        console.log("\n--- Testing pdf.PDFParse(buffer) ---");
        try {
            const data = await pdf.PDFParse(dummyBuffer);
            console.log("Success! Text:", data.text);
            return;
        } catch (e) {
            console.log("Failed:", e.message);
        }
    }

    // Test 3: new pdf.PDFParse (as class)
    if (pdf.PDFParse) {
        console.log("\n--- Testing new pdf.PDFParse(buffer) ---");
        try {
            const instance = new pdf.PDFParse(dummyBuffer);
            console.log("Instance created. Checking methods...");
            // Use it if it has a way to extract text
            console.log("Instance keys:", Object.keys(instance));
        } catch (e) {
            console.log("Failed:", e.message);
        }
    }
}

test();
