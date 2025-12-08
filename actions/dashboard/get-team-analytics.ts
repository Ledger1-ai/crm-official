import { prismadb } from "@/lib/prisma";

export type PipelineStage = "Identify" | "Engage_AI" | "Engage_Human" | "Offering" | "Finalizing" | "Closed";

export const STAGES: PipelineStage[] = [
  "Identify",
  "Engage_AI",
  "Engage_Human",
  "Offering",
  "Finalizing",
  "Closed",
];

// Gamified weights for highest stage reached
export const STAGE_WEIGHTS: Record<PipelineStage, number> = {
  Identify: 0,
  Engage_AI: 10,
  Engage_Human: 20,
  Offering: 40,
  Finalizing: 60,
  Closed: 100,
};

export type LeadTouchMetrics = {
  emailSent: number;
  callsInitiated: number;
  touches: number; // email + calls
  daysToBooking?: number; // if outreach_meeting_booked_at and outreach_sent_at are available
};

export type UserLeaderboardEntry = {
  userId: string;
  name: string | null;
  email: string;
  avatar?: string | null;
  color?: string; // optional persistent color if needed
  points: number;
  breakdown: {
    basePoints: number;
    efficiencyBonusPoints: number; // derived from multiplier effect
    speedBonusPoints: number; // derived from multiplier effect
  };
  stageCounts: Record<PipelineStage, number>;
  closedCount: number;
  achievements: { id: string; title: string; description: string; earnedAt?: string }[];
};

export type TeamOverview = {
  totalLeads: number;
  stageCounts: Record<PipelineStage, number>;
  activityCounts: {
    emailsPresent: number;
    phonesPresent: number;
    emailSent: number; // across team
    callsInitiated: number; // across team
  };
};

export type TeamAnalytics = {
  team: TeamOverview;
  leaderboard: UserLeaderboardEntry[];
  weights: Record<PipelineStage, number>;
};

function clamp(min: number, val: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function computeLeadPoints(stage: PipelineStage, metrics: LeadTouchMetrics): { points: number; basePoints: number; effBonusPoints: number; speedBonusPoints: number } {
  const base = STAGE_WEIGHTS[stage] || 0;
  let efficiencyMultiplier = 1;
  let speedMultiplier = 1;

  // Efficiency bonus: reward closing with fewer touches (only when stage is Closed)
  if (stage === "Closed") {
    const touches = metrics.touches;
    const effBonus = clamp(0, (3 - touches) / 10, 0.3); // 0..0.3 up to +30% bonus
    efficiencyMultiplier = 1 + effBonus;

    if (typeof metrics.daysToBooking === "number") {
      const speedBonus = clamp(0, (14 - metrics.daysToBooking) / 20, 0.7); // 0..0.7 up to +70% bonus
      speedMultiplier = 1 + speedBonus;
    }
  }

  const total = Math.round(base * efficiencyMultiplier * speedMultiplier);
  const effBonusPoints = Math.round(base * (efficiencyMultiplier - 1));
  const speedBonusPoints = Math.round(base * (speedMultiplier - 1));

  return { points: total, basePoints: base, effBonusPoints, speedBonusPoints };
}

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

function stageOrder(s: PipelineStage): number {
  return STAGES.indexOf(s);
}

export async function getTeamAnalytics(): Promise<TeamAnalytics> {
  // Active team members
  const users = await prismadb.users.findMany({
    where: { userStatus: "ACTIVE" as any },
    select: { id: true, name: true, email: true, avatar: true },
    orderBy: { name: "asc" },
  });

  const userIds = users.map((u) => u.id);

  // Pre-fetch all leads to build team overview
  const allLeads = await prismadb.crm_Leads.findMany({
    select: {
      id: true,
      assigned_to: true,
      email: true,
      phone: true,
      pipeline_stage: true,
      outreach_sent_at: true,
      outreach_meeting_booked_at: true,
    },
  });

  const leadIds = allLeads.map((l: any) => l.id);

  // Fetch activities once and reduce in-memory
  const emailActivities = await prismadb.crm_Lead_Activities.findMany({
    where: { type: "email_sent" },
    select: { user: true, lead: true },
  });
  const callActivities = await prismadb.crm_Lead_Activities.findMany({
    where: { type: { contains: "call", mode: "insensitive" } },
    select: { user: true, lead: true },
  });

  // Build maps keyed by `${userId}|${leadId}` => count
  const emailByUserLead = new Map<string, number>();
  for (const a of emailActivities as any[]) {
    const key = `${a.user}|${a.lead}`;
    emailByUserLead.set(key, (emailByUserLead.get(key) || 0) + 1);
  }
  const callsByUserLead = new Map<string, number>();
  for (const a of callActivities as any[]) {
    const key = `${a.user}|${a.lead}`;
    callsByUserLead.set(key, (callsByUserLead.get(key) || 0) + 1);
  }

  // Team overview stage counts
  const teamStageCounts = zeroStages();
  for (const l of allLeads as any[]) {
    const s: PipelineStage = (l.pipeline_stage as PipelineStage) || "Identify";
    if (teamStageCounts[s] !== undefined) teamStageCounts[s]++;
  }

  // Team activity counts across all users/leads
  const emailsPresent = (allLeads as any[]).filter((l) => !!l.email && String(l.email).trim().length > 0).length;
  const phonesPresent = (allLeads as any[]).filter((l) => !!l.phone && String(l.phone).trim().length > 0).length;

  const emailSentTeam = emailActivities.length;
  const callsInitiatedTeam = callActivities.length;

  const team: TeamOverview = {
    totalLeads: allLeads.length,
    stageCounts: teamStageCounts,
    activityCounts: {
      emailsPresent,
      phonesPresent,
      emailSent: emailSentTeam,
      callsInitiated: callsInitiatedTeam,
    },
  };

  const leaderboard: UserLeaderboardEntry[] = [];

  // Build per-user leaderboard entries without N+1 queries
  for (const u of users) {
    const myLeads = (allLeads as any[]).filter((l) => (l.assigned_to as string | null) === u.id);

    const byStage = zeroStages();
    let basePoints = 0;
    let effBonusPoints = 0;
    let speedBonusPoints = 0;
    let totalPoints = 0;
    let closedCount = 0;

    let speedsterCount = 0; // Closed within 7 days
    let sniperCount = 0; // Closed with <=3 touches

    for (const l of myLeads) {
      const s: PipelineStage = (l.pipeline_stage as PipelineStage) || "Identify";
      if (byStage[s] !== undefined) byStage[s]++;

      const key = `${u.id}|${l.id}`;
      const emailSent = emailByUserLead.get(key) || 0;
      const callsInitiated = callsByUserLead.get(key) || 0;
      const touches = emailSent + callsInitiated;

      let daysToBooking: number | undefined = undefined;
      if (l.outreach_sent_at && l.outreach_meeting_booked_at) {
        const ms = new Date(l.outreach_meeting_booked_at as any).getTime() - new Date(l.outreach_sent_at as any).getTime();
        daysToBooking = Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
      }

      const p = computeLeadPoints(s, { emailSent, callsInitiated, touches, daysToBooking });
      basePoints += p.basePoints;
      effBonusPoints += p.effBonusPoints;
      speedBonusPoints += p.speedBonusPoints;
      totalPoints += p.points;
      if (s === "Closed") {
        closedCount++;
        if (typeof daysToBooking === "number" && daysToBooking <= 7) speedsterCount++;
        if (touches <= 3) sniperCount++;
      }
    }

    // Achievements detection
    const achievements: { id: string; title: string; description: string; earnedAt?: string }[] = [];

    const engageAIOrMore = STAGES.filter((s) => s !== "Identify")
      .map((s) => byStage[s])
      .reduce((a, b) => a + b, 0);
    const engageHumanOrMore = STAGES.filter((s) => stageOrder(s) >= stageOrder("Engage_Human"))
      .map((s) => byStage[s])
      .reduce((a, b) => a + b, 0);

    if (engageAIOrMore >= 10) {
      achievements.push({ id: "ten-ai-engagements", title: "Momentum Builder", description: "Moved 10+ leads past Identify." });
    }
    if (engageHumanOrMore >= 5) {
      achievements.push({ id: "human-whisperer", title: "Human Whisperer", description: "Advanced 5+ leads to Engage Human or beyond." });
    }
    if (byStage.Offering >= 5) {
      achievements.push({ id: "offer-maker", title: "Offer Maker", description: "Brought 5+ leads to Offering stage." });
    }
    if (closedCount >= 5) {
      achievements.push({ id: "closer-5", title: "Closer x5", description: "Closed 5+ leads." });
    }
    if (speedsterCount >= 3) {
      achievements.push({ id: "speedster", title: "Speedster", description: "Closed 3+ leads within 7 days of outreach." });
    }
    if (sniperCount >= 3) {
      achievements.push({ id: "sniper", title: "Sniper", description: "Closed 3+ leads with 3 or fewer touches." });
    }

    leaderboard.push({
      userId: u.id,
      name: u.name || null,
      email: u.email,
      avatar: u.avatar || null,
      points: totalPoints,
      breakdown: { basePoints, efficiencyBonusPoints: effBonusPoints, speedBonusPoints },
      stageCounts: byStage,
      closedCount,
      achievements,
    });
  }

  // Sort leaderboard by points descending
  leaderboard.sort((a, b) => b.points - a.points);

  return {
    team,
    leaderboard,
    weights: STAGE_WEIGHTS,
  };
}
