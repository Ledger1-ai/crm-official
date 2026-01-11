import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { AiProvider } from "@prisma/client";

// POST /api/teams/[teamId]/ai-config - Update team AI configuration
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
        const { provider, modelId, useSystemKey, apiKey } = body;

        // Validate provider
        if (!Object.values(AiProvider).includes(provider)) {
            return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
        }

        // Verify user belongs to this team or is a global admin
        const user = await prismadb.users.findUnique({
            where: { email: session.user.email },
            select: {
                team_id: true,
                team_role: true,
                assigned_team: { select: { slug: true } }
            },
        });

        const isGlobalAdmin = user?.assigned_team?.slug === "ledger1" && user?.team_role === "SUPER_ADMIN";
        const isTeamAdmin = user?.team_id === teamId && ["OWNER", "ADMIN", "SUPER_ADMIN"].includes(user?.team_role || "");

        if (!isGlobalAdmin && !isTeamAdmin) {
            return NextResponse.json({ error: "Not authorized to modify this team's settings" }, { status: 403 });
        }

        // Upsert team AI config
        const config = await prismadb.teamAiConfig.upsert({
            where: { team_id: teamId },
            create: {
                team_id: teamId,
                provider,
                modelId: modelId || null,
                useSystemKey: useSystemKey ?? true,
                apiKey: useSystemKey ? null : (apiKey || null),
            },
            update: {
                provider,
                modelId: modelId || null,
                useSystemKey: useSystemKey ?? true,
                apiKey: useSystemKey ? null : (apiKey || null),
            },
        });

        return NextResponse.json(config);
    } catch (error) {
        console.error("[TEAM_AI_CONFIG_POST]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// GET /api/teams/[teamId]/ai-config - Get team AI configuration
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

        const config = await prismadb.teamAiConfig.findUnique({
            where: { team_id: teamId },
        });

        return NextResponse.json(config);
    } catch (error) {
        console.error("[TEAM_AI_CONFIG_GET]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
