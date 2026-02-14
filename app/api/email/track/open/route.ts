import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";

const TRANSPARENT_GIF = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
);

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (token) {
        try {
            const outreachItem = await prismadb.crm_Outreach_Items.findFirst({
                where: { tracking_token: token }
            });

            if (outreachItem && !outreachItem.openedAt) {
                await prismadb.crm_Outreach_Items.update({
                    where: { id: outreachItem.id },
                    data: {
                        openedAt: new Date(),
                        status: "OPENED"
                    }
                });

                await prismadb.crm_Outreach_Campaigns.update({
                    where: { id: outreachItem.campaign },
                    data: {
                        emails_opened: { increment: 1 }
                    }
                });
            }
        } catch (error) {
            console.error("[EMAIL_TRACK_OPEN_ERROR]", error);
        }
    }

    return new NextResponse(TRANSPARENT_GIF, {
        headers: {
            "Content-Type": "image/gif",
            "Content-Length": TRANSPARENT_GIF.length.toString(),
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
        },
    });
}
