import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

// POST: Create SLA Policy
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new NextResponse("Unauthenticated", { status: 401 });
    }

    try {
        const teamInfo = await getCurrentUserTeamId();
        const body = await req.json();

        const policy = await (prismadb as any).sLA_Policy.create({
            data: {
                ...body,
                team_id: teamInfo?.teamId,
                createdBy: session.user.id,
            },
        });

        return NextResponse.json(policy, { status: 201 });
    } catch (error) {
        console.error("[CREATE_SLA_POLICY_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// GET: List SLA Policies
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new NextResponse("Unauthenticated", { status: 401 });
    }

    try {
        const teamInfo = await getCurrentUserTeamId();
        const where: any = {};

        if (!teamInfo?.isGlobalAdmin && teamInfo?.teamId) {
            where.team_id = teamInfo.teamId;
        }

        const policies = await (prismadb as any).sLA_Policy.findMany({
            where,
            include: {
                milestones: true,
                _count: { select: { cases: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(policies, { status: 200 });
    } catch (error) {
        console.error("[GET_SLA_POLICIES]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// PUT: Update SLA Policy
export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new NextResponse("Unauthenticated", { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, ...updateData } = body;

        if (!id) {
            return new NextResponse("Policy ID is required", { status: 400 });
        }

        const updatedPolicy = await (prismadb as any).sLA_Policy.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(updatedPolicy, { status: 200 });
    } catch (error) {
        console.error("[UPDATE_SLA_POLICY_PUT]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
