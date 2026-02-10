import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { generateQuotePdf } from "@/lib/pdf-utils";
import sendEmail from "@/lib/sendmail";

export async function POST(
    req: Request,
    props: { params: Promise<{ quoteId: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const quoteId = params.quoteId;

        const quote = await prismadb.crm_Quotes.findFirst({
            where: {
                id: quoteId,
                team_id: (session.user as any).team_id,
            },
            include: {
                account: true,
                contact: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!quote) {
            return new NextResponse("Quote not found", { status: 404 });
        }

        const recipientEmail = quote.contact?.email;

        if (!recipientEmail) {
            return NextResponse.json({ error: "Contact has no email address defined" }, { status: 400 });
        }

        // Generate PDF
        const pdfBuffer = await generateQuotePdf(quote);

        // Send Email
        await sendEmail({
            to: recipientEmail,
            subject: `Sales Proposal: ${quote.title} (${quote.quoteNumber})`,
            text: `Hello ${quote.contact?.first_name || 'there'},\n\nPlease find attached the sales proposal for ${quote.title}.\n\nBest regards,\nBasalt Echo Sales Team`,
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2 style="color: #2563eb;">Sales Proposal</h2>
                    <p>Hello ${quote.contact?.first_name || 'there'},</p>
                    <p>Please find attached the sales proposal for <strong>${quote.title}</strong>.</p>
                    <p>Proposal Number: <strong>${quote.quoteNumber}</strong></p>
                    <p>Total amount: <strong>$${quote.totalAmount.toLocaleString()}</strong></p>
                    <br/>
                    <p>Best regards,</p>
                    <p><strong>Basalt Echo Sales Team</strong></p>
                </div>
            `,
            attachments: [
                {
                    filename: `Proposal_${quote.quoteNumber}.pdf`,
                    content: pdfBuffer,
                    contentType: "application/pdf"
                }
            ]
        });

        // Update status to SENT
        await prismadb.crm_Quotes.update({
            where: { id: quote.id },
            data: { status: "SENT" }
        });

        return NextResponse.json({ success: true, message: "Quote sent successfully" });

    } catch (error: any) {
        console.error("[QUOTE_SEND_EMAIL_ERROR]", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
