import { NextResponse } from 'next/server';
import { prismadb } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { path, userAgent, visitorId } = body;

        if (!path) {
            return NextResponse.json({ success: false, message: "Missing path" }, { status: 400 });
        }

        // Use the persistent visitorId from client as the 'ipHash' for unique tracking
        // This ensures refreshes don't count as new visitors
        const ipHash = visitorId || crypto.createHash('sha256').update(Math.random().toString()).digest('hex').substring(0, 10);

        // Extract Geo Headers (Vercel / Cloudflare standard)
        const city = req.headers.get('x-vercel-ip-city') || req.headers.get('cf-ipcity') || null;
        const country = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || null;

        // @ts-ignore
        await prismadb.pageView.create({
            data: {
                path,
                userAgent,
                ipHash,
                city,
                country
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[ANALYTICS_TRACK_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
