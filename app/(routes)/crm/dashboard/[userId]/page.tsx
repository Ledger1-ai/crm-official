import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import React from "react";
import Container from "../../../components/ui/Container";
import { getLeadsStageCounts } from "@/actions/dashboard/get-leads-stage-counts";
import StageProgressBar, { type StageDatum } from "@/components/StageProgressBar";

type PipelineStage = "Identify" | "Engage_AI" | "Engage_Human" | "Offering" | "Finalizing" | "Closed";

const STAGES: PipelineStage[] = [
  "Identify",
  "Engage_AI",
  "Engage_Human",
  "Offering",
  "Finalizing",
  "Closed",
];

function StageBar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{value} / {total} ({pct}%)</span>
      </div>
      <div className="h-2 w-full rounded bg-slate-200">
        <div className="h-2 rounded bg-slate-800 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function UserCRMDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/signin");
  }

  const stageData = await getLeadsStageCounts(session.user.id);
  const total = stageData.overall.counts.total;

  return (
    <div>
      <Container title={`${session.user.name} | Sales My Dashboard`} description="Lead pipeline progress across all batches">
        {/* Overview Progress Bars */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6">
          <div className="space-y-4 p-4 rounded-lg border bg-card shadow-sm">
            <h2 className="text-lg font-semibold">Overview Progress</h2>
            <div className="flex flex-col items-center justify-center">
              <StageProgressBar
                stages={STAGES.map((s) => ({ key: s, label: s.replace("_", " "), count: stageData.overall.counts.byStage[s] })) as StageDatum[]}
                total={stageData.overall.counts.total}
                orientation="vertical"
                nodeSize={26}
                trackHeight={480}
                showMetadata={true}
              />
              <div className="mt-8 grid grid-cols-2 gap-3 text-xs w-full max-w-md">
                <div className="rounded-md border p-2 bg-muted/30 text-center">
                  <div className="font-medium">Emails present</div>
                  <div className="text-muted-foreground">{stageData.overall.metrics.emailsPresent}</div>
                </div>
                <div className="rounded-md border p-2 bg-muted/30 text-center">
                  <div className="font-medium">Phones present</div>
                  <div className="text-muted-foreground">{stageData.overall.metrics.phonesPresent}</div>
                </div>
                <div className="rounded-md border p-2 bg-muted/30 text-center">
                  <div className="font-medium">Emails sent</div>
                  <div className="text-muted-foreground">{stageData.overall.metrics.emailSent}</div>
                </div>
                <div className="rounded-md border p-2 bg-muted/30 text-center">
                  <div className="font-medium">Calls initiated</div>
                  <div className="text-muted-foreground">{stageData.overall.metrics.callsInitiated}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Per-pool summary */}
          <div className="space-y-4 p-4 rounded-lg border bg-card shadow-sm">
            <h2 className="text-lg font-semibold">Lead Batches</h2>
            <div className="space-y-4 max-h-[900px] lg:max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
              {stageData.pools.length === 0 && (
                <div className="text-sm text-muted-foreground">No lead pools found. Use the LeadGen Wizard to create a pool.</div>
              )}
              {stageData.pools.map((p) => (
                <div key={p.poolId} className="space-y-2 p-3 rounded-lg border bg-card shadow-sm">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground">Assigned: {p.counts.byStage.Identify} / {p.counts.total}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>Emails: {p.metrics.emailsPresent}</span>
                    <span>Phones: {p.metrics.phonesPresent}</span>
                    <span>Emails sent: {p.metrics.emailSent}</span>
                    <span>Calls: {p.metrics.callsInitiated}</span>
                  </div>
                  <StageProgressBar
                    stages={STAGES.map((s) => ({ key: s, label: s.replace("_", " "), count: p.counts.byStage[s] })) as StageDatum[]}
                    total={p.counts.total}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stage Tabs with Tooling (placeholder for now) */}
        <div className="mt-8 p-4 rounded-lg border bg-card shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Overview Panel</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Use the tabs below to view tools and analytics associated with each stage across all lead batches.
          </p>
          <div className="flex flex-wrap gap-2">
            {STAGES.map((s) => (
              <a key={`tab-${s}`} className="px-3 py-1 rounded border hover:bg-accent" href={`#stage-${s}`}>
                {s.replace("_", " ")}
              </a>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {STAGES.map((s) => (
              <div key={`panel-${s}`} id={`stage-${s}`} className="space-y-2 p-4 rounded border">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{s.replace("_", " ")} Tools & Analytics</h3>
                  <span className="text-xs text-muted-foreground">Across all batches</span>
                </div>
                {/* Tooling placeholders; wire to real reports and actions later */}
                <ul className="text-sm list-disc pl-4 text-muted-foreground">
                  <li>Top metrics: count, % of total</li>
                  <li>Recent activities (emails sent, replies, meetings)</li>
                  <li>Actions: bulk send, follow-ups, stage transitions</li>
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
