"use client";

import Image from "next/image";
import { BarChartDemo } from "@/components/tremor/BarChart";
import { cn } from "@/lib/utils";

export type PipelineStage = "Identify" | "Engage_AI" | "Engage_Human" | "Offering" | "Finalizing" | "Closed";

type TeamOverview = {
  totalLeads: number;
  stageCounts: Record<PipelineStage, number>;
  activityCounts: {
    emailsPresent: number;
    phonesPresent: number;
    emailSent: number;
    callsInitiated: number;
  };
};

type LeaderboardEntry = {
  userId: string;
  name: string | null;
  email: string;
  avatar?: string | null;
  points: number;
  breakdown: { basePoints: number; efficiencyBonusPoints: number; speedBonusPoints: number };
  stageCounts: Record<PipelineStage, number>;
  closedCount: number;
  achievements: { id: string; title: string; description: string }[];
};

type TeamAnalyticsProps = {
  team: TeamOverview;
  leaderboard: LeaderboardEntry[];
  weights: Record<PipelineStage, number>;
  onUserSelect?: (userId: string) => void;
  isMember?: boolean;
};

export default function TeamAnalytics({ team, leaderboard, weights, onUserSelect, isMember = false }: TeamAnalyticsProps) {
  const stageChartData = Object.entries(team.stageCounts).map(([k, v]) => ({ name: k.replace("_", " "), Number: v as number }));

  const colorMap: Record<string, string> = {
    Identify: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    Engage_AI: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    Engage_Human: "bg-violet-500/10 text-violet-500 border-violet-500/20",
    Offering: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    Finalizing: "bg-teal-500/10 text-teal-500 border-teal-500/20",
    Closed: "bg-green-500/10 text-green-500 border-green-500/20",
  };
  return (
    <div className="space-y-6">
      {/* Team Overview - Hidden for Members */}
      {!isMember && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="text-sm text-muted-foreground">Total leads</div>
            <div className="text-2xl font-semibold">{team.totalLeads}</div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded border p-2 bg-muted/30 text-center">
                <div className="font-medium">Emails present</div>
                <div className="text-muted-foreground">{team.activityCounts.emailsPresent}</div>
              </div>
              <div className="rounded border p-2 bg-muted/30 text-center">
                <div className="font-medium">Phones present</div>
                <div className="text-muted-foreground">{team.activityCounts.phonesPresent}</div>
              </div>
              <div className="rounded border p-2 bg-muted/30 text-center">
                <div className="font-medium">Emails sent</div>
                <div className="text-muted-foreground">{team.activityCounts.emailSent}</div>
              </div>
              <div className="rounded border p-2 bg-muted/30 text-center">
                <div className="font-medium">Calls initiated</div>
                <div className="text-muted-foreground">{team.activityCounts.callsInitiated}</div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <BarChartDemo chartData={stageChartData} title="Pipeline distribution (team-wide)" />
          </div>
        </div>
      )}

      {/* Leaderboard - Visible to All */}
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Leaderboard</h2>
          <span className="text-xs text-muted-foreground">Points reflect highest stage reached with bonuses</span>
        </div>
        <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
          {leaderboard.length === 0 && (
            <div className="text-sm text-muted-foreground">No active team members or no activity yet.</div>
          )}
          {leaderboard.map((u, idx) => (
            <div
              key={u.userId}
              onClick={() => onUserSelect?.(u.userId)}
              className={cn(
                "p-3 rounded-lg border bg-background transition-colors",
                idx === 0 && "ring-1 ring-amber-400",
                onUserSelect ? "cursor-pointer hover:bg-muted/50" : ""
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative h-8 w-8 rounded-full overflow-hidden bg-muted">

                    <img src={u.avatar || "/images/nouser.png"} alt={u.name || u.email} className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{u.name || u.email}</div>
                    <div className="text-xs text-muted-foreground">Closed: {u.closedCount} · Base {u.breakdown.basePoints}, Eff {u.breakdown.efficiencyBonusPoints}, Speed {u.breakdown.speedBonusPoints}</div>
                  </div>
                </div>
                <div className="text-2xl font-semibold tabular-nums">{u.points}</div>
              </div>
              {/* Achievements */}
              {u.achievements.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {u.achievements.map((a) => (
                    <span key={a.id} title={a.description} className="text-[10px] px-2 py-1 rounded-full border bg-muted/40">
                      {a.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Weights legend */}
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold mb-2">Stage weights</h3>
        <div className="flex flex-wrap gap-3 text-xs">
          {Object.entries(weights).map(([stage, w]) => {
            return (
              <div key={stage} className={cn("px-3 py-1.5 rounded-md border font-medium", colorMap[stage] || "bg-muted/30 text-muted-foreground")}>
                {stage.replace("_", " ")}: {w}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
