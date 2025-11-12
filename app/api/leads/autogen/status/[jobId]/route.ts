import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadbCrm } from "@/lib/prisma-crm";

/**
 * GET /api/leads/autogen/status/[jobId]
 * Returns status and counters for a lead generation job, plus related pool info.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { jobId } = await params;
  if (!jobId) {
    return new NextResponse("Missing jobId", { status: 400 });
  }

  try {
    // Fetch job with minimal relations
    const job = await (prismadbCrm as any).crm_Lead_Gen_Jobs.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        counters: true,
        logs: true,
        pool: true,
        assigned_pool: { select: { id: true, name: true } },
        sourceEvents: { select: { id: true, type: true, fetchedAt: true } }
      }
    });

    if (!job) {
      return new NextResponse("Job not found", { status: 404 });
    }

    // Count candidates for the pool
    const candidatesCount = await (prismadbCrm as any).crm_Lead_Candidates.count({
      where: { pool: job.pool },
    });

    return NextResponse.json(
      {
        job: {
          id: job.id,
          status: job.status,
          startedAt: job.startedAt,
          finishedAt: job.finishedAt,
          counters: job.counters ?? {},
          logs: job.logs ?? [],
        },
        pool: job.assigned_pool ?? { id: job.pool },
        sourceEventsCount: Array.isArray(job.sourceEvents)
          ? job.sourceEvents.length
          : 0,
        candidatesCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[LEADS_AUTOGEN_STATUS_GET]", error);
    return new NextResponse("Failed to fetch job status", { status: 500 });
  }
}
