/**
 * generate-invoice-pdf.ts
 *
 * Shared utility for generating professional PDF invoices from crm_BillingInvoice data.
 * Uses jsPDF for client-side generation — no server round-trip needed.
 */
import jsPDF from "jspdf";
import { format } from "date-fns";

interface InvoiceLineItem {
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
}

interface InvoiceData {
    invoice_number: string;
    type: string;
    description?: string;
    period_start: string | Date;
    period_end: string | Date;
    createdAt: string | Date;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    payment_method?: string;
    payment_status: string;
    transaction_id?: string;
    paid_at?: string | Date | null;
    line_items?: InvoiceLineItem[] | null;
    team?: { name?: string; slug?: string } | null;
    subscription?: { plan_name?: string; interval?: string } | null;
}

// ── Color palette ──
const COLORS = {
    black: [24, 24, 27] as [number, number, number],
    darkGray: [63, 63, 70] as [number, number, number],
    medGray: [113, 113, 122] as [number, number, number],
    lightGray: [161, 161, 170] as [number, number, number],
    veryLight: [228, 228, 231] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
    accent: [99, 102, 241] as [number, number, number],      // indigo-500
    accentLight: [165, 180, 252] as [number, number, number], // indigo-300
    green: [34, 197, 94] as [number, number, number],
    amber: [245, 158, 11] as [number, number, number],
    red: [239, 68, 68] as [number, number, number],
    cyan: [34, 211, 238] as [number, number, number],
};

function setColor(doc: jsPDF, color: [number, number, number]) {
    doc.setTextColor(color[0], color[1], color[2]);
}

function drawLine(doc: jsPDF, y: number, x1 = 20, x2 = 190) {
    doc.setDrawColor(228, 228, 231);
    doc.setLineWidth(0.3);
    doc.line(x1, y, x2, y);
}

function statusColor(status: string): [number, number, number] {
    switch (status) {
        case "PAID": return COLORS.green;
        case "WAIVED": return COLORS.cyan;
        case "PENDING": return COLORS.amber;
        case "FAILED":
        case "REFUNDED": return COLORS.red;
        default: return COLORS.medGray;
    }
}

/**
 * Generate a professional PDF invoice and trigger browser download.
 */
export function downloadInvoicePDF(invoice: InvoiceData) {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    const pageW = 210;
    let y = 20;

    // ── Header bar ──
    doc.setFillColor(COLORS.black[0], COLORS.black[1], COLORS.black[2]);
    doc.rect(0, 0, pageW, 44, "F");

    // Brand
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    setColor(doc, COLORS.white);
    doc.text("BasaltHQ", 20, 18);

    // "INVOICE" label
    doc.setFontSize(10);
    setColor(doc, COLORS.accentLight);
    doc.text("INVOICE", 20, 28);

    // Invoice number (right-aligned)
    doc.setFontSize(10);
    setColor(doc, COLORS.lightGray);
    doc.text(invoice.invoice_number, pageW - 20, 18, { align: "right" });

    // Date
    doc.setFontSize(8);
    setColor(doc, COLORS.medGray);
    doc.text(
        `Issued: ${format(new Date(invoice.createdAt), "MMMM d, yyyy")}`,
        pageW - 20, 26, { align: "right" }
    );

    // Type badge
    const typeLabel = invoice.type.replace(/_/g, " ");
    doc.setFontSize(7);
    const typeLabelW = doc.getTextWidth(typeLabel) + 6;
    doc.setFillColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
    doc.roundedRect(pageW - 20 - typeLabelW, 30, typeLabelW + 2, 6, 1.5, 1.5, "F");
    setColor(doc, COLORS.white);
    doc.text(typeLabel, pageW - 20 - typeLabelW + 3, 34);

    y = 56;

    // ── Bill To / Invoice Details ──
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    setColor(doc, COLORS.medGray);
    doc.text("BILL TO", 20, y);
    doc.text("INVOICE DETAILS", 110, y);

    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setColor(doc, COLORS.black);
    doc.text(invoice.team?.name || "—", 20, y);

    doc.setFontSize(9);
    setColor(doc, COLORS.darkGray);
    const details: string[] = [];
    if (invoice.subscription?.plan_name) details.push(`Plan: ${invoice.subscription.plan_name}`);
    if (invoice.subscription?.interval) details.push(`Cycle: ${invoice.subscription.interval}`);
    details.push(`Period: ${format(new Date(invoice.period_start), "MMM d, yyyy")} — ${format(new Date(invoice.period_end), "MMM d, yyyy")}`);
    if (invoice.payment_method) details.push(`Payment: ${invoice.payment_method}`);

    details.forEach((line, i) => {
        doc.text(line, 110, y + i * 5);
    });

    if (invoice.team?.slug) {
        y += 5;
        doc.setFontSize(8);
        setColor(doc, COLORS.medGray);
        doc.text(`@${invoice.team.slug}`, 20, y);
    }

    y += Math.max(details.length * 5, 10) + 4;

    // ── Description ──
    if (invoice.description) {
        drawLine(doc, y);
        y += 6;
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        setColor(doc, COLORS.medGray);
        doc.text("DESCRIPTION", 20, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        setColor(doc, COLORS.darkGray);
        doc.text(invoice.description, 20, y);
        y += 8;
    }

    // ── Line Items (if available) ──
    const lineItems = (invoice.line_items as InvoiceLineItem[] | null) || [];
    if (lineItems.length > 0) {
        drawLine(doc, y);
        y += 6;

        // Table header
        doc.setFillColor(245, 245, 245);
        doc.rect(20, y - 3, 170, 8, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        setColor(doc, COLORS.medGray);
        doc.text("ITEM", 22, y + 2);
        doc.text("QTY", 120, y + 2, { align: "right" });
        doc.text("UNIT PRICE", 150, y + 2, { align: "right" });
        doc.text("TOTAL", 188, y + 2, { align: "right" });
        y += 10;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        lineItems.forEach((item) => {
            setColor(doc, COLORS.darkGray);
            doc.text(item.description, 22, y);
            doc.text(String(item.quantity), 120, y, { align: "right" });
            doc.text(`$${item.unit_price.toFixed(2)}`, 150, y, { align: "right" });
            setColor(doc, COLORS.black);
            doc.text(`$${item.total.toFixed(2)}`, 188, y, { align: "right" });
            y += 6;
        });
        y += 2;
    } else {
        // If no line items, show a single summary row
        drawLine(doc, y);
        y += 6;

        doc.setFillColor(245, 245, 245);
        doc.rect(20, y - 3, 170, 8, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        setColor(doc, COLORS.medGray);
        doc.text("ITEM", 22, y + 2);
        doc.text("AMOUNT", 188, y + 2, { align: "right" });
        y += 10;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        setColor(doc, COLORS.darkGray);
        doc.text(invoice.description || `${invoice.type.replace(/_/g, " ")} Charge`, 22, y);
        setColor(doc, COLORS.black);
        doc.text(`$${invoice.subtotal.toFixed(2)}`, 188, y, { align: "right" });
        y += 8;
    }

    // ── Totals Section ──
    drawLine(doc, y);
    y += 8;

    const totalsX = 130;
    const valX = 188;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    // Subtotal
    setColor(doc, COLORS.medGray);
    doc.text("Subtotal", totalsX, y);
    setColor(doc, COLORS.darkGray);
    doc.text(`$${invoice.subtotal.toFixed(2)}`, valX, y, { align: "right" });
    y += 6;

    // Discount
    if (invoice.discount > 0) {
        setColor(doc, COLORS.green);
        doc.text("Discount", totalsX, y);
        doc.text(`-$${invoice.discount.toFixed(2)}`, valX, y, { align: "right" });
        y += 6;
    }

    // Tax
    if (invoice.tax > 0) {
        setColor(doc, COLORS.medGray);
        doc.text("Tax", totalsX, y);
        setColor(doc, COLORS.darkGray);
        doc.text(`$${invoice.tax.toFixed(2)}`, valX, y, { align: "right" });
        y += 6;
    }

    // Total
    drawLine(doc, y - 1, totalsX, valX);
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    setColor(doc, COLORS.black);
    doc.text("Total Due", totalsX, y);
    doc.text(`$${invoice.total.toFixed(2)}`, valX, y, { align: "right" });
    y += 10;

    // ── Payment Status Badge ──
    const statusText = invoice.payment_status;
    const sColor = statusColor(statusText);
    doc.setFontSize(8);
    const statusW = doc.getTextWidth(statusText) + 8;
    doc.setFillColor(sColor[0], sColor[1], sColor[2]);
    doc.roundedRect(totalsX, y - 3, statusW, 7, 2, 2, "F");
    setColor(doc, COLORS.white);
    doc.setFont("helvetica", "bold");
    doc.text(statusText, totalsX + 4, y + 1.5);

    if (invoice.paid_at) {
        doc.setFontSize(7);
        setColor(doc, COLORS.medGray);
        doc.setFont("helvetica", "normal");
        doc.text(
            `Paid on ${format(new Date(invoice.paid_at), "MMM d, yyyy")}`,
            totalsX + statusW + 4, y + 1.5
        );
    }

    y += 12;

    // Transaction ID
    if (invoice.transaction_id) {
        doc.setFontSize(7);
        setColor(doc, COLORS.lightGray);
        doc.setFont("helvetica", "normal");
        doc.text(`Transaction: ${invoice.transaction_id}`, totalsX, y);
        y += 6;
    }

    // ── Footer ──
    const footerY = 270;
    drawLine(doc, footerY, 20, 190);
    doc.setFontSize(7);
    setColor(doc, COLORS.lightGray);
    doc.setFont("helvetica", "normal");
    doc.text("BasaltHQ Platform", 20, footerY + 5);
    doc.text("https://basalthq.com", 20, footerY + 9);
    doc.text(
        `Generated ${format(new Date(), "MMMM d, yyyy 'at' HH:mm")}`,
        pageW - 20, footerY + 5, { align: "right" }
    );
    doc.text(
        "This is an electronically generated invoice.",
        pageW - 20, footerY + 9, { align: "right" }
    );

    // ── Download ──
    doc.save(`invoice-${invoice.invoice_number}.pdf`);
}

/**
 * Generate a multi-invoice summary PDF (for CSV-like batch export in PDF format).
 */
export function downloadInvoicesSummaryPDF(invoices: InvoiceData[], title = "Billing History") {
    const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
    });

    const pageW = 297;
    let y = 20;

    // ── Header ──
    doc.setFillColor(COLORS.black[0], COLORS.black[1], COLORS.black[2]);
    doc.rect(0, 0, pageW, 30, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    setColor(doc, COLORS.white);
    doc.text("BasaltHQ", 15, 14);

    doc.setFontSize(9);
    setColor(doc, COLORS.accentLight);
    doc.text(title.toUpperCase(), 15, 22);

    doc.setFontSize(8);
    setColor(doc, COLORS.medGray);
    doc.text(
        `Generated ${format(new Date(), "MMMM d, yyyy")}`,
        pageW - 15, 14, { align: "right" }
    );
    doc.text(
        `${invoices.length} invoice${invoices.length !== 1 ? "s" : ""}`,
        pageW - 15, 20, { align: "right" }
    );

    y = 40;

    // ── Table header ──
    const cols = [
        { label: "INVOICE #", x: 15, w: 40 },
        { label: "TYPE", x: 56, w: 28 },
        { label: "TEAM", x: 85, w: 45 },
        { label: "PERIOD", x: 131, w: 48 },
        { label: "SUBTOTAL", x: 180, w: 22, align: "right" as const },
        { label: "DISCOUNT", x: 203, w: 22, align: "right" as const },
        { label: "TOTAL", x: 226, w: 22, align: "right" as const },
        { label: "STATUS", x: 250, w: 20 },
        { label: "DATE", x: 271, w: 20 },
    ];

    doc.setFillColor(245, 245, 245);
    doc.rect(10, y - 4, pageW - 20, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    setColor(doc, COLORS.medGray);
    cols.forEach(c => {
        doc.text(c.label, c.align === "right" ? c.x + c.w : c.x, y, { align: c.align || "left" });
    });
    y += 8;

    // ── Table rows ──
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);

    let grandTotal = 0;

    invoices.forEach((inv, idx) => {
        // New page if needed
        if (y > 190) {
            doc.addPage();
            y = 20;
        }

        // Alternate row bg
        if (idx % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(10, y - 3.5, pageW - 20, 7, "F");
        }

        setColor(doc, COLORS.darkGray);
        doc.text(inv.invoice_number, 15, y);

        doc.setFontSize(6.5);
        setColor(doc, COLORS.accent);
        doc.text(inv.type.replace(/_/g, " "), 56, y);

        doc.setFontSize(7.5);
        setColor(doc, COLORS.black);
        doc.text((inv.team?.name || "—").substring(0, 22), 85, y);

        setColor(doc, COLORS.medGray);
        doc.text(
            `${format(new Date(inv.period_start), "MMM d")} – ${format(new Date(inv.period_end), "MMM d, yy")}`,
            131, y
        );

        setColor(doc, COLORS.darkGray);
        doc.text(`$${inv.subtotal.toFixed(2)}`, 202, y, { align: "right" });

        if (inv.discount > 0) {
            setColor(doc, COLORS.green);
            doc.text(`-$${inv.discount.toFixed(2)}`, 225, y, { align: "right" });
        } else {
            setColor(doc, COLORS.lightGray);
            doc.text("—", 225, y, { align: "right" });
        }

        doc.setFont("helvetica", "bold");
        setColor(doc, COLORS.black);
        doc.text(`$${inv.total.toFixed(2)}`, 248, y, { align: "right" });
        doc.setFont("helvetica", "normal");

        const sColor = statusColor(inv.payment_status);
        setColor(doc, sColor);
        doc.text(inv.payment_status, 250, y);

        setColor(doc, COLORS.medGray);
        doc.text(format(new Date(inv.createdAt), "MM/dd/yy"), 271, y);

        grandTotal += inv.total;
        y += 7;
    });

    // ── Grand total ──
    y += 4;
    drawLine(doc, y, 180, pageW - 15);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setColor(doc, COLORS.black);
    doc.text("Grand Total:", 180, y);
    doc.text(`$${grandTotal.toFixed(2)}`, 248, y, { align: "right" });

    // ── Footer ──
    const footerY = 200;
    doc.setFontSize(6);
    setColor(doc, COLORS.lightGray);
    doc.setFont("helvetica", "normal");
    doc.text("BasaltHQ Platform • This is an electronically generated document.", 15, footerY);

    doc.save(`${title.toLowerCase().replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
