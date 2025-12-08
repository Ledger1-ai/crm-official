import { prismadb } from "@/lib/prisma";

export type PipelineStage =
  | "Identify"
  | "Engage_AI"
  | "Engage_Human"
  | "Offering"
  | "Finalizing"
  | "Closed";

export type StageCounts = {
  total: number;
  byStage: Record<PipelineStage, number>;
};

export type ActivityMetrics = {
  emailsPresent: number; // leads with an email
  phonesPresent: number; // leads with a phone
  emailSent: number; // crm_Lead_Activities(type = 'email_sent') scoped to user/leads
  callsInitiated: number; // crm_Lead_Activities(type contains 'call') scoped to user/leads
};

export type OverallSummary = {
  counts: StageCounts;
  metrics: ActivityMetrics;
};

export type PoolStageSummary = {
  poolId: string;
  name: string;
  counts: StageCounts; // total = all leads in pool; Identify = assigned_to count; other stages = pool-wide counts
  metrics: ActivityMetrics; // metrics for user's assigned leads within this pool
  assignedCount: number; // number of leads in this pool assigned to the user (for filtering in UI)
};

function zeroStages(): Record<PipelineStage, number> {
  return {
    Identify: 0,
    Engage_AI: 0,
    Engage_Human: 0,
    Offering: 0,
    Finalizing: 0,
    Closed: 0,
  };
}

export async function getLeadsStageCounts(userId: string): Promise<{
  overall: OverallSummary;
  pools: PoolStageSummary[];
}> {
  const stages: PipelineStage[] = [
    "Identify",
    "Engage_AI",
    "Engage_Human",
    "Offering",
    "Finalizing",
    "Closed",
  ];

  // Overall (assigned to the user)
  const myLeads = await prismadb.crm_Leads.findMany({
    where: { assigned_to: userId as any },
    select: {
      id: true,
      email: true,
      phone: true,
      pipeline_stage: true,
    },
  });

  const overallByStage = zeroStages();
  for (const l of myLeads as any[]) {
    const s = (l.pipeline_stage as PipelineStage) || "Identify";
    if (overallByStage[s] !== undefined) overallByStage[s]++;
  }

  const myLeadIds = myLeads.map((l: any) => l.id);
  const emailsPresent = (myLeads as any[]).filter((l) => !!l.email && String(l.email).trim().length > 0).length;
  const phonesPresent = (myLeads as any[]).filter((l) => !!l.phone && String(l.phone).trim().length > 0).length;

  const [emailSent, callsInitiated] = await Promise.all([
    prismadb.crm_Lead_Activities.count({ where: { user: userId as any, type: "email_sent", lead: { in: myLeadIds as any } } }),
    prismadb.crm_Lead_Activities.count({ where: { user: userId as any, type: { contains: "call", mode: "insensitive" }, lead: { in: myLeadIds as any } } }),
  ]);

  const overall: OverallSummary = {
    counts: { total: myLeads.length, byStage: overallByStage },
    metrics: { emailsPresent, phonesPresent, emailSent, callsInitiated },
  };

  // User's pools
  const pools = await prismadb.crm_Lead_Pools.findMany({
    where: { user: userId as any },
    select: { id: true, name: true },
  });
  if (pools.length === 0) return { overall, pools: [] };

  const poolIds = pools.map((p) => p.id);

  // Fetch all pool<->lead mappings in one go
  const poolMaps = await prismadb.crm_Lead_Pools_Leads.findMany({
    where: { pool: { in: poolIds as any } },
    select: { pool: true, lead: true },
  });

  // Build pool -> leadIds map
  const poolToLeadIds = new Map<string, string[]>();
  for (const m of poolMaps as any[]) {
    const arr = poolToLeadIds.get(m.pool) || [];
    arr.push(m.lead);
    poolToLeadIds.set(m.pool, arr);
  }

  // Union of all pool lead ids
  const unionLeadIds = Array.from(new Set(poolMaps.map((m: any) => m.lead)));

  // Fetch all leads involved in those pools once
  const poolLeads = unionLeadIds.length
    ? await prismadb.crm_Leads.findMany({
        where: { id: { in: unionLeadIds as any } },
        select: { id: true, assigned_to: true, email: true, phone: true, pipeline_stage: true },
      })
    : [];

  // Index by lead id
  const leadById = new Map<string, any>();
  for (const l of poolLeads as any[]) leadById.set(l.id, l);

  // For activity metrics per pool for the user's assigned subset, fetch all activities once
  const assignedUnionIds = (poolLeads as any[])
    .filter((l) => (l.assigned_to as string | null) === userId)
    .map((l) => l.id);

  const [poolEmailActs, poolCallActs] = assignedUnionIds.length
    ? await Promise.all([
        prismadb.crm_Lead_Activities.findMany({
          where: { user: userId as any, type: "email_sent", lead: { in: assignedUnionIds as any } },
          select: { lead: true },
        }),
        prismadb.crm_Lead_Activities.findMany({
          where: { user: userId as any, type: { contains: "call", mode: "insensitive" }, lead: { in: assignedUnionIds as any } },
          select: { lead: true },
        }),
      ])
    : [[], []];

  // Build leadId -> counts maps
  const emailCountByLead = new Map<string, number>();
  for (const a of poolEmailActs as any[]) emailCountByLead.set(a.lead, (emailCountByLead.get(a.lead) || 0) + 1);
  const callCountByLead = new Map<string, number>();
  for (const a of poolCallActs as any[]) callCountByLead.set(a.lead, (callCountByLead.get(a.lead) || 0) + 1);

  const poolSummaries: PoolStageSummary[] = [];

  for (const p of pools) {
    const ids = poolToLeadIds.get(p.id) || [];
    if (ids.length === 0) {
      poolSummaries.push({
        poolId: p.id,
        name: p.name,
        counts: { total: 0, byStage: zeroStages() },
        metrics: { emailsPresent: 0, phonesPresent: 0, emailSent: 0, callsInitiated: 0 },
        assignedCount: 0,
      });
      continue;
    }

    const leads = ids.map((id) => leadById.get(id)).filter(Boolean);

    const byStage = zeroStages();
    let identifyAssigned = 0;
    for (const l of leads as any[]) {
      const stage = (l.pipeline_stage as PipelineStage) || "Identify";
      if ((l.assigned_to as string | null) === userId) identifyAssigned++;
      if (stage !== "Identify" && byStage[stage] !== undefined) byStage[stage]++;
    }
    byStage.Identify = identifyAssigned;

    const assignedLeads = (leads as any[]).filter((l) => (l.assigned_to as string | null) === userId);

    const poolEmailsPresent = assignedLeads.filter((l) => !!l.email && String(l.email).trim().length > 0).length;
    const poolPhonesPresent = assignedLeads.filter((l) => !!l.phone && String(l.phone).trim().length > 0).length;

    let poolEmailSent = 0;
    let poolCallsInitiated = 0;
    for (const l of assignedLeads as any[]) {
      poolEmailSent += emailCountByLead.get(l.id) || 0;
      poolCallsInitiated += callCountByLead.get(l.id) || 0;
    }

    poolSummaries.push({
      poolId: p.id,
      name: p.name,
      counts: { total: ids.length, byStage },
      metrics: { emailsPresent: poolEmailsPresent, phonesPresent: poolPhonesPresent, emailSent: poolEmailSent, callsInitiated: poolCallsInitiated },
      assignedCount: identifyAssigned,
    });
  }

  const filteredPools = poolSummaries.filter((ps) => ps.assignedCount > 0);

  return { overall, pools: filteredPools };
}
