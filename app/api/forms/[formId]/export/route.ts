import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { format } from "date-fns";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ formId: string }> }
) {
    try {
        const { formId } = await params;

        if (!formId) {
            return new NextResponse("Form ID is required", { status: 400 });
        }

        const submissions = await prismadb.formSubmission.findMany({
            where: { form_id: formId },
            orderBy: { createdAt: "desc" }
        });

        if (!submissions || submissions.length === 0) {
            return new NextResponse("No submissions found", { status: 404 });
        }

        // 1. Identify all unique headers from all submissions
        const fieldHeaders = new Set<string>();
        submissions.forEach(sub => {
            if (sub.data && typeof sub.data === 'object') {
                Object.keys(sub.data).forEach(key => fieldHeaders.add(key));
            }
        });

        const sortedHeaders = Array.from(fieldHeaders).sort();
        const allHeaders = ["ID", "Submitted At", ...sortedHeaders];

        // 2. Generate CSV Rows
        const csvRows = [allHeaders.join(",")];

        submissions.forEach(sub => {
            const data: any = sub.data || {};
            const row = [
                sub.id,
                format(new Date(sub.createdAt), "yyyy-MM-dd HH:mm:ss"),
                ...sortedHeaders.map(header => {
                    const val = data[header];
                    // Escape quotes and wrap in quotes if necessary
                    const stringVal = val === undefined || val === null ? "" : String(val);
                    if (stringVal.includes(",") || stringVal.includes('"') || stringVal.includes("\n")) {
                        return `"${stringVal.replace(/"/g, '""')}"`;
                    }
                    return stringVal;
                })
            ];
            csvRows.push(row.join(","));
        });

        const csvString = csvRows.join("\n");

        return new NextResponse(csvString, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="submissions-${formId}.csv"`,
            }
        });

    } catch (error) {
        console.error("[FORM_EXPORT_CSV]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
