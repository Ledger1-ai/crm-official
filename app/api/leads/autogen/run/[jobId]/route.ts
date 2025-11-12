import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runLeadGenPipeline } from "@/actions/leads/run-pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Allow up to 120s for scraping; adjust based on hosting limits
export const maxDuration = 120;

/**
 * POST /api/leads/autogen/run/[jobId]
 * Triggers the lead generation pipeline for a given job.
 * Returns creation counts.
 */
export async function POST(
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
    const { createdCandidates, createdContacts } = await runLeadGenPipeline({
      jobId,
      userId: session.user.id,
    });

    return NextResponse.json(
      { ok: true, createdCandidates, createdContacts },
      { status: 200 }
    );
  } catch (error) {
    console.error("[LEADS_AUTOGEN_RUN_POST]", error);
    return new NextResponse("Failed to run pipeline", { status: 500 });
  }
}
