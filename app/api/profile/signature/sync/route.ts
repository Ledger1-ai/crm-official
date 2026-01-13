
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGmailClientForUser } from "@/lib/gmail";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions as any);
        const userId = (session as any)?.user?.id;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { signatureHtml } = await req.json();
        if (!signatureHtml) {
            return new NextResponse("Missing signature HTML", { status: 400 });
        }

        const gmail = await getGmailClientForUser(userId);
        if (!gmail) {
            return new NextResponse("Gmail not connected", { status: 400 });
        }

        // List all aliases
        const aliasesRes = await gmail.users.settings.sendAs.list({ userId: "me" });
        const aliases = aliasesRes.data.sendAs || [];

        if (aliases.length === 0) {
            return new NextResponse("No sendAs aliases found", { status: 404 });
        }

        let updatedCount = 0;
        const errors: string[] = [];

        // Update signature for each alias
        await Promise.all(aliases.map(async (alias) => {
            if (!alias.sendAsEmail) return;
            try {
                await gmail.users.settings.sendAs.update({
                    userId: "me",
                    sendAsEmail: alias.sendAsEmail,
                    requestBody: {
                        signature: signatureHtml,
                    },
                });
                updatedCount++;
            } catch (err: any) {
                console.error(`Failed to update signature for ${alias.sendAsEmail}:`, err);
                errors.push(`${alias.sendAsEmail}: ${err.message}`);
            }
        }));

        if (updatedCount === 0 && errors.length > 0) {
            return new NextResponse(`Failed to update signatures: ${errors.join(", ")}`, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            updatedCount,
            totalFound: aliases.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error: any) {
        console.error("[SIGNATURE_SYNC]", error);
        return new NextResponse(error.message || "Internal Server Error", { status: 500 });
    }
}
