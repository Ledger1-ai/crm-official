import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

// POST /api/teams/[teamId]/captcha-config - Update team Captcha configuration
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ teamId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const { teamId } = resolvedParams;
        const body = await request.json();
        const { site_key, secret_key } = body;

        // Verify user belongs to this team or is a global admin
        const user = await prismadb.users.findUnique({
            where: { email: session.user.email },
            select: {
                team_id: true,
                team_role: true,
            },
        });

        // PLATFORM_ADMIN has god mode - no team restriction
        const isGlobalAdmin = user?.team_role === "PLATFORM_ADMIN";
        const isTeamAdmin = user?.team_id === teamId && ["OWNER", "ADMIN", "PLATFORM_ADMIN"].includes(user?.team_role || "");

        if (!isGlobalAdmin && !isTeamAdmin) {
            return NextResponse.json({ error: "Not authorized to modify this team's settings" }, { status: 403 });
        }

        // Upsert team Captcha config
        const config = await prismadb.teamCaptchaConfig.upsert({
            where: { team_id: teamId },
            create: {
                team_id: teamId,
                site_key,
                secret_key,
            },
            update: {
                site_key,
                secret_key,
            },
        });

        return NextResponse.json(config);
    } catch (error) {
        console.error("[TEAM_CAPTCHA_CONFIG_POST]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// GET /api/teams/[teamId]/captcha-config - Get team Captcha configuration
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ teamId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const { teamId } = resolvedParams;

        const config = await prismadb.teamCaptchaConfig.findUnique({
            where: { team_id: teamId },
        });

        return NextResponse.json(config);
    } catch (error) {
        console.error("[TEAM_CAPTCHA_CONFIG_GET]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
