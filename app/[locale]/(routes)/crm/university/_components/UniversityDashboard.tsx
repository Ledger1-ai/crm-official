"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Video, Trophy, Calculator, GraduationCap, PlayCircle, FileText } from "lucide-react";
import Heading from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";

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

export default function UniversityDashboard() {
    const [activeTab, setActiveTab] = useState<"lms" | "gamification">("lms");

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
            <div className="flex flex-col">
                <Heading
                    title="University & LMS"
                    description="Master the CRM, track your performance, and level up your sales game."
                />
                <Separator className="mt-4" />
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-4 border-b pb-2">
                <button
                    onClick={() => setActiveTab("lms")}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-2.5 ${activeTab === "lms" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <BookOpen className="w-4 h-4" />
                    Learning Center
                </button>
                <button
                    onClick={() => setActiveTab("gamification")}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-2.5 ${activeTab === "gamification" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <Trophy className="w-4 h-4" />
                    Gamification & Stats
                </button>
            </div>

            {/* LMS Section */}
            {activeTab === "lms" && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Welcome Card */}
                    <Card className="col-span-full bg-gradient-to-r from-primary/10 to-transparent border-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <GraduationCap className="w-6 h-6 text-primary" />
                                Getting Started with BasaltCRM
                            </CardTitle>
                            <CardDescription>
                                New here? Start with these essential guides to set up your workspace and start closing deals.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    {/* Video Tutorials */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Video className="w-5 h-5 text-blue-500" />
                                Video Tutorials
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20">
                                    <PlayCircle className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm">CRM Walkthrough</h4>
                                    <p className="text-xs text-muted-foreground mt-1">A 5-minute tour of the main dashboard and features.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20">
                                    <PlayCircle className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm">Lead Management 101</h4>
                                    <p className="text-xs text-muted-foreground mt-1">How to import, assign, and track leads effectively.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Written Guides */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="w-5 h-5 text-amber-500" />
                                Documentation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-2">
                            <div className="p-3 text-sm font-medium hover:underline cursor-pointer">
                                How to configure your email signature
                            </div>
                            <div className="h-px bg-border/50" />
                            <div className="p-3 text-sm font-medium hover:underline cursor-pointer">
                                Understanding pipeline stages
                            </div>
                            <div className="h-px bg-border/50" />
                            <div className="p-3 text-sm font-medium hover:underline cursor-pointer">
                                Using the AI Dialer
                            </div>
                        </CardContent>
                    </Card>

                    {/* Best Practices */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-emerald-500" />
                                Sales Academy
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-2 text-sm text-muted-foreground">
                            <p>Advanced strategies for high-performing sales teams.</p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li>The Art of the Follow-up</li>
                                <li>Handling Objections</li>
                                <li>Closing Techniques</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Gamification Section */}
            {activeTab === "gamification" && (
                <div className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Points Calculator */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calculator className="w-5 h-5" />
                                    Points Calculator
                                </CardTitle>
                                <CardDescription>See how much each deal is worth towards your score.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Stage</label>
                                        <Select value={stage} onValueChange={(v) => setStage(v)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {STAGES.map((s) => (
                                                    <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Touches</label>
                                        <Input type="number" value={touches} onChange={(e) => setTouches(e.target.value)} min={0} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Days to Book</label>
                                        <Input type="number" value={daysToBooking} onChange={(e) => setDaysToBooking(e.target.value)} min={0} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                                    <div className="text-center">
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Base</div>
                                        <div className="text-xl font-bold">{result.base}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Eff. Bonus</div>
                                        <div className="text-xl font-bold text-emerald-500">+{result.effBonusPct}%</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Speed Bonus</div>
                                        <div className="text-xl font-bold text-blue-500">+{result.speedBonusPct}%</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Total</div>
                                        <div className="text-2xl font-black text-primary">{result.total}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Achievement Rules */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Achievements & Milestones</CardTitle>
                                <CardDescription>Unlock badges by hitting these targets.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div className="flex items-center justify-between p-2 border rounded hover:bg-muted/50">
                                    <span className="font-semibold">Momentum Builder</span>
                                    <Badge variant="secondary">10 Leads &gt; Identify</Badge>
                                </div>
                                <div className="flex items-center justify-between p-2 border rounded hover:bg-muted/50">
                                    <span className="font-semibold">Human Whisperer</span>
                                    <Badge variant="secondary">5 Leads &gt; Human</Badge>
                                </div>
                                <div className="flex items-center justify-between p-2 border rounded hover:bg-muted/50">
                                    <span className="font-semibold">Closer x5</span>
                                    <Badge variant="outline" className="border-primary text-primary">5 Deals Closed</Badge>
                                </div>
                                <div className="flex items-center justify-between p-2 border rounded hover:bg-muted/50">
                                    <span className="font-semibold">Speedster</span>
                                    <span className="text-muted-foreground text-xs">Close w/in 7 days</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
