import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const targetUrl = searchParams.get("url");

    if (!token || !targetUrl) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    try {
        // Record the click
        const outreachItem = await prismadb.crm_Outreach_Items.findFirst({
            where: { tracking_token: token }
        });

        if (outreachItem) {
            await prismadb.crm_Outreach_Items.update({
                where: { id: outreachItem.id },
                data: {
                    clickedAt: new Date(),
                    status: "CLICKED"
                }
            });

            // Update campaign stats
            await prismadb.crm_Outreach_Campaigns.update({
                where: { id: outreachItem.campaign },
                data: {
                    emails_opened: { increment: 1 } // If click happened, it's definitely opened too
                }
            });
        }

        return NextResponse.redirect(targetUrl);
    } catch (error) {
        console.error("[EMAIL_TRACK_CLICK_ERROR]", error);
        return NextResponse.redirect(targetUrl);
    }
}
