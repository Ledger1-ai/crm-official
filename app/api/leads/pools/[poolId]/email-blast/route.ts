import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadbCrm } from "@/lib/prisma-crm";

type EmailBlastRequest = {
  selectedContactIds: string[];
  subject: string;
  body: string; // may include placeholders like {fullName}, {companyName}, {title}
};

type PreparedEmail = {
  contactId: string;
  to: string;
  subject: string;
  body: string;
  meta: {
    fullName?: string;
    title?: string;
    companyName?: string;
    domain?: string;
  };
};

/**
 * POST /api/leads/pools/[poolId]/email-blast
 * Prepares an email blast for selected contacts in the pool.
 * Returns prepared emails (no sending here; integrate with your email sending flow).
 */
export async function POST(
  req: Request,
  context: { params: { poolId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const poolId = context?.params?.poolId;
  if (!poolId) {
    return new NextResponse("Missing poolId", { status: 400 });
  }

  let payload: EmailBlastRequest;
  try {
    payload = await req.json();
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  if (!Array.isArray(payload.selectedContactIds) || payload.selectedContactIds.length === 0) {
    return new NextResponse("No contacts selected", { status: 400 });
  }
  if (!payload.subject?.trim() || !payload.body?.trim()) {
    return new NextResponse("Subject and body are required", { status: 400 });
  }

  try {
    // Fetch contacts limited to the given pool and selected IDs
    // We first fetch candidates for the pool to build a map of candidateId -> company data
    const candidates = await (prismadbCrm as any).crm_Lead_Candidates.findMany({
      where: { pool: poolId },
      select: {
        id: true,
        companyName: true,
        domain: true,
      },
    });
    const candidateMeta = new Map<string, { companyName?: string; domain?: string }>();
    for (const c of candidates) {
      candidateMeta.set(c.id, { companyName: c.companyName, domain: c.domain });
    }

    // Fetch contacts by IDs
    const contacts = await (prismadbCrm as any).crm_Contact_Candidates.findMany({
      where: { id: { in: payload.selectedContactIds } },
      select: {
        id: true,
        email: true,
        fullName: true,
        title: true,
        leadCandidate: true,
      },
    });

    const templateReplace = (tpl: string, meta: Record<string, string | undefined>) => {
      return tpl
        .replace(/\{fullName\}/g, meta.fullName || "")
        .replace(/\{title\}/g, meta.title || "")
        .replace(/\{companyName\}/g, meta.companyName || "")
        .replace(/\{domain\}/g, meta.domain || "");
    };

    const prepared: PreparedEmail[] = contacts
      .filter((c: any) => !!c.email)
      .map((c: any) => {
        const metaBase = candidateMeta.get(c.leadCandidate) || {};
        const meta = {
          fullName: c.fullName || "",
          title: c.title || "",
          companyName: metaBase.companyName || "",
          domain: metaBase.domain || "",
        };
        return {
          contactId: c.id,
          to: c.email,
          subject: templateReplace(payload.subject, meta),
          body: templateReplace(payload.body, meta),
          meta,
        };
      });

    return NextResponse.json(
      {
        preparedCount: prepared.length,
        prepared,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[LEADS_POOL_EMAIL_BLAST_POST]", error);
    return new NextResponse("Failed to prepare email blast", { status: 500 });
  }
}
