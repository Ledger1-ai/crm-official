import { prismadbCrm } from "@/lib/prisma-crm";
import { z } from "zod";

// Schema for the Lead Generation Wizard input
export const LeadGenWizardSchema = z.object({
  name: z.string().min(1, "Name your Lead Pool"),
  description: z.string().optional(),
  icp: z.object({
    industries: z.array(z.string()).optional(),
    companySizes: z.array(z.string()).optional(),
    geos: z.array(z.string()).optional(),
    techStack: z.array(z.string()).optional(),
    titles: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    excludeDomains: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }),
  providers: z
    .object({
      agenticAI: z.boolean().default(true).optional(), // Autonomous AI agent mode (ENABLED BY DEFAULT)
      serp: z.boolean().default(true).optional(),
      crawler: z.boolean().default(true).optional(),
      aiQueries: z.boolean().default(true).optional(),
      aiAnalysis: z.boolean().default(true).optional(),
    })
    .optional(),
  // Optional advanced params for the pipeline
  limits: z
    .object({
      maxCompanies: z.number().int().positive().max(2000).default(100).optional(),
      maxContactsPerCompany: z.number().int().positive().max(50).default(3).optional(),
    })
    .optional(),
});

export type LeadGenWizardInput = z.infer<typeof LeadGenWizardSchema>;

export type StartLeadGenJobParams = {
  userId: string;
  wizard: LeadGenWizardInput;
};

export type StartLeadGenJobResult = {
  poolId: string;
  jobId: string;
};

/**
 * Creates a Lead Pool and an associated Lead Generation Job in QUEUED status.
 * This is the entry point called by the Lead Generation Wizard.
 *
 * Notes:
 * - This writes to crm_Lead_Pools and crm_Lead_Gen_Jobs using the new Prisma models.
 * - The actual scraping/enrichment pipeline should be queued separately and update crm_Lead_Gen_Jobs.status.
 * - We store the wizard ICP config and provider toggles on the pool (icpConfig) and job (providers/queryTemplates).
 */
export async function startLeadGenJob(
  params: StartLeadGenJobParams
): Promise<StartLeadGenJobResult> {
  const { userId, wizard } = params;

  // Validate wizard payload
  const parsed = LeadGenWizardSchema.safeParse(wizard);
  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
    throw new Error(`Invalid wizard input - ${msg}`);
  }

  // Create Lead Pool
  const pool = await (prismadbCrm as any).crm_Lead_Pools.create({
    data: {
      name: wizard.name,
      description: wizard.description,
      user: userId,
      icpConfig: {
        ...parsed.data.icp,
        limits: parsed.data.limits ?? {},
      },
      // status defaults to "ACTIVE"
    },
    select: { id: true },
  });

  // Initialize counters/logs
  const counters = {
    companiesFound: 0,
    companiesCrawled: 0,
    candidatesCreated: 0,
    contactsCreated: 0,
    emailsVerified: 0,
    errors: 0,
  };

  // Create Lead Gen Job in QUEUED status
  const job = await (prismadbCrm as any).crm_Lead_Gen_Jobs.create({
    data: {
      user: userId,
      pool: pool.id,
      status: "QUEUED" as any, // LeadGenJobStatus
      providers: parsed.data.providers ?? {},
      queryTemplates: {
        // Seed with simple defaults; can be expanded by an LLM helper later
        base: [
          "site:linkedin.com/company {industry} {geo}",
          "site:crunchbase.com/organization {industry} {geo}",
          "site:news.ycombinator.com {industry} {geo}",
          "{industry} companies in {geo} using {tech}",
        ],
      },
      counters,
      logs: [],
    },
    select: { id: true },
  });

  return { poolId: pool.id, jobId: job.id };
}
