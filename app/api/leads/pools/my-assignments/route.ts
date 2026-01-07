import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadbCrm } from "@/lib/prisma-crm";

/**
 * GET /api/leads/pools/my-assignments
 * Returns lead pools where the user is in the assigned_members array
 */
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const pools = await (prismadbCrm as any).crm_Lead_Pools.findMany({
            where: {
                assigned_members: { has: session.user.id },
            },
            select: {
                id: true,
                name: true,
                description: true,
                createdAt: true,
                _count: {
                    select: { candidates: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const results = pools.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            createdAt: p.createdAt?.toISOString(),
            candidatesCount: p._count?.candidates || 0,
        }));

        return NextResponse.json({ pools: results }, { status: 200 });
    } catch (error) {
        console.error("[LEADS_POOLS_MY_ASSIGNMENTS_GET]", error);
        return new NextResponse("Failed to fetch pool assignments", { status: 500 });
    }
}
