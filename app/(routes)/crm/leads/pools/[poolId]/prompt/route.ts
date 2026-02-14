import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadbCrm } from "@/lib/prisma-crm";

// PATCH /api/leads/pools/[poolId]/prompt
// Body: { prompt: string }
// Updates the pool.icpConfig.prompt for the current user's pool
export async function PATCH(req: Request, { params }: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const poolId = params?.poolId;
    if (!poolId) return new NextResponse("Missing poolId", { status: 400 });

    const { prompt } = await req.json();
    if (typeof prompt !== "string" || !prompt.trim().length) {
      return new NextResponse("Invalid prompt", { status: 400 });
    }

    // Validate pool ownership
    const pool = await (prismadbCrm as any).crm_Lead_Pools.findUnique({
      where: { id: poolId },
      select: { id: true, user: true, icpConfig: true },
    });
    if (!pool) return new NextResponse("Pool not found", { status: 404 });
    if (pool.user !== session.user.id) return new NextResponse("Forbidden", { status: 403 });

    const nextConfig = { ...(pool.icpConfig || {}), prompt };
    await (prismadbCrm as any).crm_Lead_Pools.update({
      where: { id: poolId },
      data: { icpConfig: nextConfig as any },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[LEADS_POOLS_PROMPT_PATCH]", error);
    return new NextResponse("Failed to update pool prompt", { status: 500 });
  }
}
