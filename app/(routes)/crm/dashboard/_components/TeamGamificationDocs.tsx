"use client";

import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// Mirror the weights from get-team-analytics for transparency
const STAGE_WEIGHTS: Record<string, number> = {
  Identify: 0,
  Engage_AI: 10,
  Engage_Human: 20,
  Offering: 40,
  Finalizing: 60,
  Closed: 100,
};
const STAGES = Object.keys(STAGE_WEIGHTS);

function clamp(min: number, val: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

export default function TeamGamificationDocs() {
  // Toggles for detail views
  const [openSection, setOpenSection] = useState<string | null>(null);

  // Calculator state
  const [stage, setStage] = useState<string>("Closed");
  const [touches, setTouches] = useState<string>("3");
  const [daysToBooking, setDaysToBooking] = useState<string>("7");

  const result = useMemo(() => {
    const base = STAGE_WEIGHTS[stage] || 0;
    const t = Number(touches) || 0;
    const d = Number(daysToBooking);

    let effBonus = 0;
    let speedBonus = 0;

    if (stage === "Closed") {
      effBonus = clamp(0, (3 - t) / 10, 0.3); // up to +30%
      if (!Number.isNaN(d)) {
        speedBonus = clamp(0, (14 - d) / 20, 0.7); // up to +70%
      }
    }

    const efficiencyMultiplier = 1 + effBonus;
    const speedMultiplier = 1 + speedBonus;
    const total = Math.round(base * efficiencyMultiplier * speedMultiplier);

    return {
      base,
      effBonusPct: Math.round(effBonus * 100),
      speedBonusPct: Math.round(speedBonus * 100),
      total,
    };
  }, [stage, touches, daysToBooking]);

  return (
    <div className="space-y-6">
      {/* Overview containers */}
      <Card className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Documentation & Formulas</h2>
          <span className="text-xs text-muted-foreground">Click sections to expand details</span>
        </div>

        {/* Sections: click to open details */}
        <div className="space-y-2">
          {/* Tracked Metrics */}
          <div className="rounded border bg-muted/30 p-3 cursor-pointer" onClick={() => setOpenSection(openSection === "metrics" ? null : "metrics")}> 
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Tracked Metrics</div>
              <div className="text-xs text-muted-foreground">Pipeline distribution · Contactability · Activities</div>
            </div>
            {openSection === "metrics" && (
              <div className="mt-3 text-sm space-y-2">
                <ul className="list-disc pl-5">
                  <li>Pipeline Stage Distribution: Identify, Engage AI, Engage Human, Offering, Finalizing, Closed</li>
                  <li>Contactability: Leads with emails and phones present</li>
                  <li>Activities: Emails sent and calls initiated (crm_Lead_Activities)</li>
                  <li>Per-user metrics: Same counts scoped to leads assigned to each user</li>
                  <li>Speed proxy: Days between outreach_sent_at and outreach_meeting_booked_at for Closed leads</li>
                  <li>Efficiency proxy: Touches to close (emails + calls for assigned user)</li>
                </ul>
              </div>
            )}
          </div>

          {/* Points Model */}
          <div className="rounded border bg-muted/30 p-3 cursor-pointer" onClick={() => setOpenSection(openSection === "points" ? null : "points")}> 
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Points Model</div>
              <div className="text-xs text-muted-foreground">Base weights by stage</div>
            </div>
            {openSection === "points" && (
              <div className="mt-3 text-sm">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {STAGES.map((s) => (
                    <div key={s} className="px-2 py-1 rounded border bg-background text-xs flex items-center justify-between">
                      <span>{s.replace("_", " ")}</span>
                      <span className="font-medium">{STAGE_WEIGHTS[s]}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Each lead contributes points based on the highest pipeline stage reached.</p>
              </div>
            )}
          </div>

          {/* Bonuses */}
          <div className="rounded border bg-muted/30 p-3 cursor-pointer" onClick={() => setOpenSection(openSection === "bonuses" ? null : "bonuses")}> 
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Closed-stage Bonuses</div>
              <div className="text-xs text-muted-foreground">Efficiency & Speed multipliers</div>
            </div>
            {openSection === "bonuses" && (
              <div className="mt-3 text-sm space-y-2">
                <div className="text-xs">Efficiency Bonus (Closed only): up to +30% for ≤3 touches</div>
                <pre className="text-[11px] bg-background p-2 rounded border overflow-auto">{`effBonus = clamp(0, (3 - touches) / 10, 0.3)
effMultiplier = 1 + effBonus`}</pre>
                <div className="text-xs">Speed Bonus (Closed only): up to +70% for booking within 14 days</div>
                <pre className="text-[11px] bg-background p-2 rounded border overflow-auto">{`speedBonus = clamp(0, (14 - daysToBooking) / 20, 0.7)
speedMultiplier = 1 + speedBonus`}</pre>
                <div className="text-xs">Final points:</div>
                <pre className="text-[11px] bg-background p-2 rounded border overflow-auto">{`finalPoints = round(base * (1 + effBonus) * (1 + speedBonus))`}</pre>
              </div>
            )}
          </div>

          {/* Achievements */}
          <div className="rounded border bg-muted/30 p-3 cursor-pointer" onClick={() => setOpenSection(openSection === "achievements" ? null : "achievements")}> 
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Achievements</div>
              <div className="text-xs text-muted-foreground">Milestones to motivate behavior</div>
            </div>
            {openSection === "achievements" && (
              <div className="mt-3 text-sm space-y-2">
                <ul className="list-disc pl-5">
                  <li>Momentum Builder: Moved 10+ leads past Identify</li>
                  <li>Human Whisperer: Advanced 5+ leads to Engage Human or beyond</li>
                  <li>Offer Maker: Brought 5+ leads to Offering</li>
                  <li>Closer x5: Closed 5+ leads</li>
                  <li>Speedster: Closed 3+ leads within 7 days of outreach</li>
                  <li>Sniper: Closed 3+ leads with ≤3 touches</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Interactive calculator */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Points Calculator</h3>
          <span className="text-xs text-muted-foreground">Experiment with inputs to see dynamic results</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs">Stage</label>
            <Select value={stage} onValueChange={(v: any) => setStage(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => (
                  <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs">Touches (emails + calls)</label>
            <Input type="number" value={touches} onChange={(e) => setTouches(e.target.value)} min={0} />
          </div>
          <div>
            <label className="text-xs">Days to booking</label>
            <Input type="number" value={daysToBooking} onChange={(e) => setDaysToBooking(e.target.value)} min={0} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="rounded border p-2 bg-muted/30 text-center">
            <div className="font-medium">Base</div>
            <div className="text-muted-foreground">{result.base}</div>
          </div>
          <div className="rounded border p-2 bg-muted/30 text-center">
            <div className="font-medium">Efficiency bonus</div>
            <div className="text-muted-foreground">{result.effBonusPct}%</div>
          </div>
          <div className="rounded border p-2 bg-muted/30 text-center">
            <div className="font-medium">Speed bonus</div>
            <div className="text-muted-foreground">{result.speedBonusPct}%</div>
          </div>
          <div className="rounded border p-2 bg-muted/30 text-center">
            <div className="font-medium">Final points</div>
            <div className="text-muted-foreground text-base font-semibold">{result.total}</div>
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground">
          Formula: round(base × (1 + efficiencyBonus) × (1 + speedBonus))
        </div>
      </Card>
    </div>
  );
}
