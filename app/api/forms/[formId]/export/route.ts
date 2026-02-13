import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { requireApiAuth } from "@/lib/api-auth-guard";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ formId: string }> }
) {
    // ── Auth guard ──
    const session = await requireApiAuth();
    if (session instanceof Response) return session;

    try {
        const { formId } = await params;

        if (!formId) {
            return new NextResponse("Form ID is required", { status: 400 });
        }

        // Fetch ALL submissions (no limit for export)
        const submissions = await (prismadb as any).formSubmission.findMany({
            where: { form_id: formId, is_deleted: false },
            orderBy: { createdAt: "desc" }
        });

        if (!submissions || submissions.length === 0) {
            return new NextResponse("No submissions found", { status: 404 });
        }

        const isAirdropForm = formId === "6986b9050b7508214f5180ce";

        // 1. Identify headers and prepare data
        const fieldHeaders = new Set<string>();
        submissions.forEach((sub: any) => {
            if (sub.data && typeof sub.data === "object") {
                Object.keys(sub.data).forEach((key) => fieldHeaders.add(key));
            }
        });

        const sortedHeaders = Array.from(fieldHeaders).sort();

        let finalHeaders: string[] = [];
        if (isAirdropForm) {
            finalHeaders = ["Email", "Wallet Addresses", "Socials/Screen Names", "Submitted At"];
        } else {
            finalHeaders = ["ID", "Submitted At", ...sortedHeaders];
        }

        // 2. Map submissions to rows
        const rowData = submissions.map((sub: any) => {
            const data: any = sub.data || {};

            if (isAirdropForm) {
                return {
                    "Email": sub.extracted_email || data.email || "",
                    "Wallet Addresses": data.wallet_addresses || "",
                    "Socials/Screen Names": data.socials_list || "",
                    "Submitted At": format(new Date(sub.createdAt), "yyyy-MM-dd HH:mm:ss")
                };
            } else {
                const row: any = {
                    "ID": sub.id,
                    "Submitted At": format(new Date(sub.createdAt), "yyyy-MM-dd HH:mm:ss")
                };
                sortedHeaders.forEach(header => {
                    row[header] = data[header] === undefined || data[header] === null ? "" : String(data[header]);
                });
                return row;
            }
        });

        // 3. Create Workbook and Worksheet
        const ws = XLSX.utils.json_to_sheet(rowData, { header: finalHeaders });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Submissions");

        // 4. Generate Buffer
        const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="submissions-${formId}-${new Date().toISOString().split('T')[0]}.xlsx"`,
            }
        });

    } catch (error) {
        console.error("[FORM_EXPORT_EXCEL]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
