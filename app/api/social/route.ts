import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/actions/audit";

// GET - Fetch social settings (public)
export async function GET() {
    try {
        let settings = await prismadb.socialSettings.findFirst();

        // Create default settings if none exist
        if (!settings) {
            settings = await prismadb.socialSettings.create({
                data: {
                    xTwitterUrl: "https://x.com/BasaltAI",
                    discordUrl: "https://discord.gg/gcgNugyWkg",
                    githubUrl: "https://github.com/Ledger1-ai/crm-official",
                }
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.log("[SOCIAL_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// PUT - Update social settings (admin only)
export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();

        // Remove id from body to avoid Prisma errors

        const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...updateData } = body;

        let settings = await prismadb.socialSettings.findFirst();

        if (!settings) {
            settings = await prismadb.socialSettings.create({ data: updateData });
        } else {
            settings = await prismadb.socialSettings.update({
                where: { id: settings.id },
                data: updateData
            });
        }

        await logActivity(
            "Updated Social Links",
            "Social Media",
            "Updated social media URLs"
        );

        return NextResponse.json(settings);
    } catch (error) {
        console.log("[SOCIAL_PUT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
