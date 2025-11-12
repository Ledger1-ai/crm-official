import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadbCrm } from "@/lib/prisma-crm";
import { z } from "zod";

type CandidateInput = {
  dedupeKey: string;
  domain?: string;
  companyName?: string;
  homepageUrl?: string;
  description?: string;
  industry?: string;
  techStack?: string[];
  existingId?: string | null;
};

type ContactInput = {
  dedupeKey: string;
  candidateKey?: string;
  fullName?: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  existingId?: string | null;
};

const bodySchema = z
  .object({
    poolId: z.string().optional(),
    newPool: z
      .object({
        name: z.string().min(1),
        description: z.string().optional(),
      })
      .optional(),
    creates: z.object({
      candidates: z.array(
        z.object({
          dedupeKey: z.string().min(1),
          domain: z.string().optional(),
          companyName: z.string().optional(),
          homepageUrl: z.string().optional(),
          description: z.string().optional(),
          industry: z.string().optional(),
          techStack: z.array(z.string()).optional(),
          existingId: z.string().nullable().optional(),
        })
      ),
      contacts: z.array(
        z.object({
          dedupeKey: z.string().min(1),
          candidateKey: z.string().optional(),
          fullName: z.string().optional(),
          title: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          linkedinUrl: z.string().optional(),
          existingId: z.string().nullable().optional(),
        })
      ),
    }),
    updates: z.object({
      candidates: z.array(
        z.object({
          dedupeKey: z.string().min(1),
          domain: z.string().optional(),
          companyName: z.string().optional(),
          homepageUrl: z.string().optional(),
          description: z.string().optional(),
          industry: z.string().optional(),
          techStack: z.array(z.string()).optional(),
          existingId: z.string().nullable().optional(),
        })
      ),
      contacts: z.array(
        z.object({
          dedupeKey: z.string().min(1),
          candidateKey: z.string().optional(),
          fullName: z.string().optional(),
          title: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          linkedinUrl: z.string().optional(),
          existingId: z.string().nullable().optional(),
        })
      ),
    }),
  })
  .refine((d) => !!d.poolId || !!d.newPool, {
    message: "Provide either poolId or newPool",
  });

async function ensureCandidateId(poolId: string, key?: string, contact?: ContactInput): Promise<string> {
  // Prefer provided candidateKey
  let dedupeKey = (key || "").trim().toLowerCase();

  // Fallback: email domain
  if (!dedupeKey && contact?.email) {
    const parts = contact.email.toLowerCase().split("@");
    if (parts.length === 2) {
      dedupeKey = parts[1];
    }
  }

  // Final fallback: synthesize a placeholder key
  if (!dedupeKey) {
    dedupeKey = `import:${contact?.dedupeKey}`;
  }

  // Try to find existing candidate
  const existing = await (prismadbCrm as any).crm_Lead_Candidates.findFirst({
    where: { pool: poolId, dedupeKey },
    select: { id: true },
  });
  if (existing?.id) return existing.id;

  // Create a minimal stub candidate so the contact can link
  const created = await (prismadbCrm as any).crm_Lead_Candidates.create({
    data: {
      pool: poolId,
      dedupeKey,
      domain: dedupeKey.includes(".") ? dedupeKey : undefined,
      companyName: undefined,
      homepageUrl: undefined,
      description: "Auto-created stub from import",
      industry: undefined,
      techStack: undefined,
    },
    select: { id: true },
  });
  return created.id;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return new NextResponse(parsed.error.message, { status: 400 });
    }
    const { poolId, newPool, creates, updates } = parsed.data;

    // Resolve target pool: verify ownership if existing, or create new pool
    let targetPoolId: string;
    if (poolId) {
      const pool = await (prismadbCrm as any).crm_Lead_Pools.findFirst({
        where: { id: poolId, user: session.user.id },
        select: { id: true },
      });
      if (!pool) {
        return new NextResponse("Lead Pool not found", { status: 404 });
      }
      targetPoolId = pool.id;
    } else {
      const created = await (prismadbCrm as any).crm_Lead_Pools.create({
        data: {
          name: newPool!.name,
          description: newPool?.description,
          user: session.user.id,
          status: "ACTIVE",
        },
        select: { id: true },
      });
      targetPoolId = created.id;
    }

    let createdCandidates = 0;
    let updatedCandidates = 0;
    let createdContacts = 0;
    let updatedContacts = 0;

    // Apply Candidate Creates
    for (const c of creates.candidates as CandidateInput[]) {
      const existing = await (prismadbCrm as any).crm_Lead_Candidates.findFirst({
        where: { pool: targetPoolId, dedupeKey: c.dedupeKey.toLowerCase() },
        select: { id: true },
      });
      if (existing?.id) {
        // Treat as update to avoid duplicate
        await (prismadbCrm as any).crm_Lead_Candidates.update({
          where: { id: existing.id },
          data: {
            domain: c.domain,
            companyName: c.companyName,
            homepageUrl: c.homepageUrl,
            description: c.description,
            industry: c.industry,
            techStack: c.techStack,
          },
        });
        updatedCandidates++;
      } else {
        await (prismadbCrm as any).crm_Lead_Candidates.create({
          data: {
            pool: targetPoolId,
            dedupeKey: c.dedupeKey.toLowerCase(),
            domain: c.domain,
            companyName: c.companyName,
            homepageUrl: c.homepageUrl,
            description: c.description,
            industry: c.industry,
            techStack: c.techStack,
          },
        });
        createdCandidates++;
      }
    }

    // Apply Candidate Updates
    for (const c of updates.candidates as CandidateInput[]) {
      let targetId = c.existingId || null;
      if (!targetId) {
        const existing = await (prismadbCrm as any).crm_Lead_Candidates.findFirst({
          where: { pool: targetPoolId, dedupeKey: c.dedupeKey.toLowerCase() },
          select: { id: true },
        });
        targetId = existing?.id ?? null;
      }
      if (targetId) {
        await (prismadbCrm as any).crm_Lead_Candidates.update({
          where: { id: targetId },
          data: {
            domain: c.domain,
            companyName: c.companyName,
            homepageUrl: c.homepageUrl,
            description: c.description,
            industry: c.industry,
            techStack: c.techStack,
          },
        });
        updatedCandidates++;
      } else {
        // No existing found; create instead
        await (prismadbCrm as any).crm_Lead_Candidates.create({
          data: {
            pool: targetPoolId,
            dedupeKey: c.dedupeKey.toLowerCase(),
            domain: c.domain,
            companyName: c.companyName,
            homepageUrl: c.homepageUrl,
            description: c.description,
            industry: c.industry,
            techStack: c.techStack,
          },
        });
        createdCandidates++;
      }
    }

    // Apply Contact Creates
    for (const c of creates.contacts as ContactInput[]) {
      const candidateId = await ensureCandidateId(targetPoolId, c.candidateKey, c);

      // Check for existing by dedupeKey (and candidate if present)
      const existing = await (prismadbCrm as any).crm_Contact_Candidates.findFirst({
        where: {
          dedupeKey: c.dedupeKey.toLowerCase(),
          leadCandidate: candidateId,
        },
        select: { id: true },
      });

      if (existing?.id) {
        await (prismadbCrm as any).crm_Contact_Candidates.update({
          where: { id: existing.id },
          data: {
            fullName: c.fullName,
            title: c.title,
            email: c.email?.toLowerCase(),
            phone: c.phone,
            linkedinUrl: c.linkedinUrl,
          },
        });
        updatedContacts++;
      } else {
        await (prismadbCrm as any).crm_Contact_Candidates.create({
          data: {
            leadCandidate: candidateId,
            dedupeKey: c.dedupeKey.toLowerCase(),
            fullName: c.fullName,
            title: c.title,
            email: c.email?.toLowerCase(),
            phone: c.phone,
            linkedinUrl: c.linkedinUrl,
          },
        });
        createdContacts++;
      }
    }

    // Apply Contact Updates
    for (const c of updates.contacts as ContactInput[]) {
      let targetId = c.existingId || null;
      let candidateId: string | null = null;

      if (c.candidateKey) {
        const cand = await (prismadbCrm as any).crm_Lead_Candidates.findFirst({
          where: { pool: targetPoolId, dedupeKey: c.candidateKey.toLowerCase() },
          select: { id: true },
        });
        candidateId = cand?.id ?? null;
      }

      if (!targetId) {
        const existing = await (prismadbCrm as any).crm_Contact_Candidates.findFirst({
          where: {
            dedupeKey: c.dedupeKey.toLowerCase(),
            ...(candidateId ? { leadCandidate: candidateId } : {}),
          },
          select: { id: true },
        });
        targetId = existing?.id ?? null;
      }

      if (targetId) {
        await (prismadbCrm as any).crm_Contact_Candidates.update({
          where: { id: targetId },
          data: {
            fullName: c.fullName,
            title: c.title,
            email: c.email?.toLowerCase(),
            phone: c.phone,
            linkedinUrl: c.linkedinUrl,
          },
        });
        updatedContacts++;
      } else {
        // No existing found; create instead (ensuring a candidate link)
        const ensuredCandidateId = await ensureCandidateId(targetPoolId, c.candidateKey, c);
        await (prismadbCrm as any).crm_Contact_Candidates.create({
          data: {
            leadCandidate: ensuredCandidateId,
            dedupeKey: c.dedupeKey.toLowerCase(),
            fullName: c.fullName,
            title: c.title,
            email: c.email?.toLowerCase(),
            phone: c.phone,
            linkedinUrl: c.linkedinUrl,
          },
        });
        createdContacts++;
      }
    }

    return NextResponse.json(
      {
        poolId: targetPoolId,
        created: { candidates: createdCandidates, contacts: createdContacts },
        updated: { candidates: updatedCandidates, contacts: updatedContacts },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[LEADS_POOLS_IMPORT_COMMIT]", error);
    return new NextResponse(error?.message || "Failed to commit import", { status: 500 });
  }
}
