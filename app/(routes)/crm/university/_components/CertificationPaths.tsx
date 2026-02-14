"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Medal,
    CheckCircle2,
    Circle,
    Lock,
    Zap,
    GraduationCap,
    Award,
    Star,
    ArrowRight,
    Search,
    Database,
    Phone,
    Bot,
    ShieldCheck,
    TrendingUp,
    Layout,
    Users,
    Mail,
    Target,
    Workflow,
    Webhook,
    PenTool,
    Trophy,
    Crown,
    Check,
    Calculator,
    Smartphone
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PHASES = [
    { title: "The Foundation", id: "foundation", range: "0-15%", color: "text-blue-400", borderColor: "border-blue-500/20", bgColor: "bg-blue-500/10" },
    { title: "Data Pioneer", id: "data-pioneer", range: "15-35%", color: "text-cyan-400", borderColor: "border-cyan-500/20", bgColor: "bg-cyan-500/10" },
    { title: "Outreach Architect", id: "outreach-architect", range: "35-60%", color: "text-emerald-400", borderColor: "border-emerald-500/20", bgColor: "bg-emerald-500/10" },
    { title: "Automation Specialist", id: "automation-specialist", range: "60-85%", color: "text-violet-400", borderColor: "border-violet-500/20", bgColor: "bg-violet-500/10" },
    { title: "Strategic Master", id: "strategic-master", range: "85-100%", color: "text-amber-400", borderColor: "border-amber-500/20", bgColor: "bg-amber-500/10" },
];

const MILESTONES = [
    // Foundation
    {
        id: 1, phase: "foundation", title: "Workspace Founder", subtitle: "Establishing the core", icon: Users, xp: 50,
        requirements: [
            { text: "Complete user profile (Avatar/Social)", done: true },
            { text: "Configure org timezone & locale", done: true },
            { text: "Define fiscal year start date", done: true }
        ]
    },
    {
        id: 2, phase: "foundation", title: "Brand Guardian", subtitle: "Visual identity", icon: Layout, xp: 50,
        requirements: [
            { text: "Upload primary and secondary logos", done: true },
            { text: "Set custom hex brand colors", done: false },
            { text: "Customize system-wide help URL", done: false }
        ]
    },
    {
        id: 3, phase: "foundation", title: "Team Captain", subtitle: "Building the army", icon: Users, xp: 100,
        requirements: [
            { text: "Invite first 3 team members", done: false },
            { text: "Define department hierarchies", done: false },
            { text: "Set global invite permissions", done: false }
        ]
    },
    {
        id: 4, phase: "foundation", title: "Module Explorer", subtitle: "Customizing tools", icon: Layout, xp: 100,
        requirements: [
            { text: "Enable/Disable 5+ core modules", done: false },
            { text: "Set module-specific sidebar order", done: false },
            { text: "Review module audit logs", done: false }
        ]
    },
    {
        id: 5, phase: "foundation", title: "Security Officer", subtitle: "Hardening access", icon: ShieldCheck, xp: 150,
        requirements: [
            { text: "Enable Multi-factor Auth (MFA)", done: false },
            { text: "Restrict IPs for Admin access", done: false },
            { text: "Rotate API access tokens", done: false }
        ]
    },
    // Data Pioneer
    {
        id: 6, phase: "data-pioneer", title: "Lead Hunter", subtitle: "Volume processing", icon: Search, xp: 200,
        requirements: [
            { text: "Import 500+ leads via CSV", done: false },
            { text: "Setup auto-verify for new leads", done: false },
            { text: "Map 20+ custom data fields", done: false }
        ]
    },
    {
        id: 7, phase: "data-pioneer", title: "Pool Master", subtitle: "Segmentation", icon: Database, xp: 250,
        requirements: [
            { text: "Create 5 dynamic Lead Pools", done: false },
            { text: "Set automated pool rotation rules", done: false },
            { text: "Define pool ownership weighted logic", done: false }
        ]
    },
    {
        id: 8, phase: "data-pioneer", title: "The Big Picture", subtitle: "Data architecture", icon: Star, xp: 150,
        requirements: [
            { text: "Complete ER diagram walk-thru", done: false },
            { text: "Define 3 custom entity relationships", done: false },
            { text: "Audit cross-object data integrity", done: false }
        ]
    },
    {
        id: 9, phase: "data-pioneer", title: "Smart Enroller", subtitle: "AI Enrichment", icon: Zap, xp: 300,
        requirements: [
            { text: "Enrich 200+ leads with AI agent", done: false },
            { text: "Score leads by 'Intent' level", done: false },
            { text: "Setup enrichment triggers for 10DLC", done: false }
        ]
    },
    {
        id: 10, phase: "data-pioneer", title: "Hygiene Specialist", subtitle: "Data health", icon: ShieldCheck, xp: 200,
        requirements: [
            { text: "Run full deduplication sweep (Global)", done: false },
            { text: "Standardize phone formatting", done: false },
            { text: "Bounce-check entire email database", done: false }
        ]
    },
    // Outreach Architect
    {
        id: 11, phase: "outreach-architect", title: "Script Writer", subtitle: "Template mastery", icon: Mail, xp: 200,
        requirements: [
            { text: "Draft 10 A/B sequence templates", done: false },
            { text: "Setup 3 liquid-logic dynamic variables", done: false },
            { text: "Translate templates for 2+ locales", done: false }
        ]
    },
    {
        id: 12, phase: "outreach-architect", title: "The Launch", subtitle: "Campaign execution", icon: TrendingUp, xp: 500,
        requirements: [
            { text: "Execute 1,000+ outreach sends", done: false },
            { text: "Maintain <2% bounce rate", done: false },
            { text: "Schedule sequences for 3 time-zones", done: false }
        ]
    },
    {
        id: 13, phase: "outreach-architect", title: "Digital Signature", subtitle: "Professionalism", icon: PenTool, xp: 150,
        requirements: [
            { text: "Deploy vCards for entire team", done: false },
            { text: "Verify SPF/DKIM/DMARC status", done: false },
            { text: "Setup 10DLC brand trust certificate", done: false }
        ]
    },
    {
        id: 14, phase: "outreach-architect", title: "Human Factor", subtitle: "Task optimization", icon: CheckCircle2, xp: 300,
        requirements: [
            { text: "Complete 50 manual outreach tasks", done: false },
            { text: "SLA response time < 4 hours", done: false },
            { text: "Record 20+ call notes in CRM", done: false }
        ]
    },
    {
        id: 15, phase: "outreach-architect", title: "High Conversationalist", subtitle: "AI Detection", icon: Target, xp: 400,
        requirements: [
            { text: "Achieve 30% positive reply rate", done: false },
            { text: "Train AI for sentiment detection", done: false },
            { text: "Automate 'OOO' reply handling", done: false }
        ]
    },
    // Automation Specialist
    {
        id: 16, phase: "automation-specialist", title: "Flow General", subtitle: "Visual logic", icon: Workflow, xp: 600,
        requirements: [
            { text: "Build 5 production FlowState maps", done: false },
            { text: "Integrate multi-node error handling", done: false },
            { text: "Sync flow data to Google Sheets", done: false }
        ]
    },
    {
        id: 17, phase: "automation-specialist", title: "Reactive Master", subtitle: "Trigger logic", icon: Zap, xp: 450,
        requirements: [
            { text: "Deploy 10+ real-time event triggers", done: false },
            { text: "Setup cross-module webhooks", done: false },
            { text: "Monitor trigger latency (<200ms)", done: false }
        ]
    },
    {
        id: 18, phase: "automation-specialist", title: "Decisionist", subtitle: "Conditional flows", icon: Workflow, xp: 500,
        requirements: [
            { text: "Implement 3-level If/Else nesting", done: false },
            { text: "Route leads by revenue and locale", done: false },
            { text: "Autofill fields based on AI scoring", done: false }
        ]
    },
    {
        id: 19, phase: "automation-specialist", title: "The Voice", subtitle: "Telephony mastery", icon: Phone, xp: 400,
        requirements: [
            { text: "Setup AI Voice greeting agent", done: false },
            { text: "Configure 10+ SIP trunk endpoints", done: false },
            { text: "Automate SMS-to-Voice handoff", done: false }
        ]
    },
    {
        id: 20, phase: "automation-specialist", title: "Ecosystem Builder", subtitle: "Integrations", icon: Webhook, xp: 550,
        requirements: [
            { text: "Setup Zapier/Make bi-directional sync", done: false },
            { text: "Deploy custom Webhook secret keys", done: false },
            { text: "Pass Basalt events to external BI", done: false }
        ]
    },
    // Strategic Master
    {
        id: 21, phase: "strategic-master", title: "Compliance Officer", subtitle: "Governance", icon: ShieldCheck, xp: 750,
        requirements: [
            { text: "Pass 10DLC Brand/Camp registration", done: false },
            { text: "Audit TCPA consent for entire database", done: false },
            { text: "Implement automated DNC handling", done: false }
        ]
    },
    {
        id: 22, phase: "strategic-master", title: "Sovereign Admin", subtitle: "Roles & Permissions", icon: Users, xp: 600,
        requirements: [
            { text: "Create 20+ granular custom roles", done: false },
            { text: "Define cross-department visibility", done: false },
            { text: "Manage multi-org child workspaces", done: false }
        ]
    },
    {
        id: 23, phase: "strategic-master", title: "Elite Deal Closer", subtitle: "ROI realization", icon: Trophy, xp: 1000,
        requirements: [
            { text: "Manage $1M+ in Deal Room pipeline", done: false },
            { text: "Close 5 enterprise deals in CRM", done: false },
            { text: "Track multi-touch attribution", done: false }
        ]
    },
    {
        id: 24, phase: "strategic-master", title: "ROI Legend", subtitle: "Strategic reporting", icon: TrendingUp, xp: 1200,
        requirements: [
            { text: "Achieve 3.0x ROI on Basalt spend", done: false },
            { text: "Reduce CAC by 40% via automation", done: false },
            { text: "Present quarterly growth board", done: false }
        ]
    },
    {
        id: 25, phase: "strategic-master", title: "Arch-Mage of Basalt", subtitle: "Ultimate mastery", icon: GraduationCap, xp: 2500,
        requirements: [
            { text: "6 months of active platform usage", done: false },
            { text: "Zero critical data gaps (Full Health)", done: false },
            { text: "Publish a custom template pack", done: false },
            { text: "Mentor 5+ other platform users", done: false }
        ]
    },
];

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

export default function CertificationPaths() {
    const [stage, setStage] = React.useState<string>("Closed");
    const [touches, setTouches] = React.useState<string>("3");
    const [daysToBooking, setDaysToBooking] = React.useState<string>("7");

    const simulatorResult = React.useMemo(() => {
        const base = STAGE_WEIGHTS[stage] || 0;
        const t = Number(touches) || 0;
        const d = Number(daysToBooking);
        let effBonus = 0;
        let speedBonus = 0;
        if (stage === "Closed") {
            effBonus = clamp(0, (3 - t) / 10, 0.3);
            if (!Number.isNaN(d)) speedBonus = clamp(0, (14 - d) / 20, 0.7);
        }
        const total = Math.round(base * (1 + effBonus) * (1 + speedBonus));
        return { base, effBonusPct: Math.round(effBonus * 100), speedBonusPct: Math.round(speedBonus * 100), total };
    }, [stage, touches, daysToBooking]);

    const totalRequirements = MILESTONES.reduce((acc, m) => acc + m.requirements.length, 0);
    const completedRequirements = MILESTONES.reduce((acc, m) => acc + m.requirements.filter(r => r.done).length, 0);
    const progressPct = Math.round((completedRequirements / totalRequirements) * 100);

    const totalXp = MILESTONES.reduce((acc, m) => {
        const doneRatio = m.requirements.filter(r => r.done).length / m.requirements.length;
        return acc + Math.round(m.xp * doneRatio);
    }, 0);

    const maxTotalXp = MILESTONES.reduce((acc, m) => acc + m.xp, 0);

    return (
        <div className="space-y-12 pb-32">
            {/* Header / Global Rank */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-10 bg-black/40 p-10 rounded-3xl border border-white/10 relative overflow-hidden backdrop-blur-md">
                <div className="space-y-4 flex-1 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.25em]">
                            <Crown className="w-3.5 h-3.5" />
                            Professional Certification
                        </div>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-[0.25em]">
                            <Zap className="w-3.5 h-3.5" />
                            {totalXp} / {maxTotalXp} XP
                        </div>
                    </div>
                    <h2 className="text-5xl font-black tracking-tighter leading-none py-1">
                        Mastery <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 italic pr-2">Evolved</span>
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
                        Becoming a **Master Admin** is a journey of precision and volume. Each task completed builds your **XP** and unlocks new achievement tiers.
                    </p>

                    {/* Achievement Snippets */}
                    <div className="flex flex-wrap gap-4 pt-4">
                        {[
                            { name: "Closer x5", icon: Trophy, active: false },
                            { name: "Data Architect", icon: Database, active: true },
                            { name: "Speed Demon", icon: Zap, active: false }
                        ].map(ach => (
                            <div key={ach.name} className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all",
                                ach.active ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : "bg-white/5 border-white/5 text-gray-600 grayscale"
                            )}>
                                <ach.icon className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{ach.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-10 relative z-10">
                    <div className="text-right hidden md:block">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Rank Standing</p>
                        <p className="text-3xl font-black text-white">Elite Pioneer</p>
                        <div className="flex justify-end gap-1 mt-2">
                            {[1, 2, 3].map(i => <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />)}
                            <Star className="w-4 h-4 text-gray-800 fill-gray-800" />
                        </div>
                    </div>
                    <div className="w-px h-20 bg-white/10 hidden md:block" />
                    <div className="relative w-28 h-28 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90">
                            <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                            <circle
                                cx="56" cy="56" r="50"
                                stroke="currentColor" strokeWidth="8"
                                fill="transparent"
                                className="text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                strokeDasharray={314}
                                strokeDashoffset={314 - (314 * progressPct) / 100}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-white leading-none">{progressPct}%</span>
                            <span className="text-[10px] uppercase font-bold text-gray-500 mt-1">Global</span>
                        </div>
                    </div>
                </div>

                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-[120px] pointer-events-none" />
            </div>

            {/* Matrix of Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
                {PHASES.map((phase) => (
                    <div key={phase.id} className="space-y-6">
                        <div className="space-y-1 px-2 border-l-2 border-white/10 pl-4">
                            <h3 className={cn("text-lg font-black uppercase tracking-[0.1em]", phase.color)}>
                                {phase.title}
                            </h3>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                                {phase.range} Achievement Tier
                            </p>
                        </div>

                        <div className="space-y-6">
                            {MILESTONES.filter(m => m.phase === phase.id).map((milestone) => {
                                const locked = isLocked(milestone);
                                const allDone = milestone.requirements.every(r => r.done);
                                const doneCount = milestone.requirements.filter(r => r.done).length;
                                const totalCount = milestone.requirements.length;

                                return (
                                    <motion.div
                                        key={milestone.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        whileHover={!locked ? { y: -5 } : {}}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    >
                                        <Card className={cn(
                                            "relative overflow-hidden transition-all duration-300 border bg-black/40 group",
                                            allDone
                                                ? "border-emerald-500/40 bg-emerald-500/[0.03] shadow-[0_0_25px_rgba(16,185,129,0.05)]"
                                                : locked
                                                    ? "border-white/5 opacity-30 grayscale pointer-events-none"
                                                    : "border-white/10 hover:border-white/30 hover:bg-white/[0.04] shadow-xl"
                                        )}>
                                            <CardHeader className="p-4 pb-2">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-all duration-500",
                                                        allDone
                                                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 rotate-[360deg]"
                                                            : locked
                                                                ? "bg-white/5 border-white/5 text-gray-700"
                                                                : "bg-white/5 border-white/10 text-gray-400 group-hover:border-primary/50 group-hover:text-primary"
                                                    )}>
                                                        {allDone ? (
                                                            <CheckCircle2 className="w-5 h-5" />
                                                        ) : locked ? (
                                                            <Lock className="w-4 h-4" />
                                                        ) : (
                                                            <milestone.icon className="w-5 h-5" />
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[9px] font-black text-gray-600 block uppercase tracking-widest leading-none">Level</span>
                                                        <span className="text-sm font-black text-white leading-none block mt-1">{milestone.id}</span>
                                                        {!locked && (
                                                            <div className="mt-1 flex items-center gap-1 justify-end text-[10px] font-black text-amber-500">
                                                                <Zap className="w-2.5 h-2.5" />
                                                                {milestone.xp}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mt-3">
                                                    <CardTitle className={cn(
                                                        "text-sm font-black tracking-tight flex items-center gap-2",
                                                        locked ? "text-gray-600" : "text-gray-100"
                                                    )}>
                                                        {milestone.title}
                                                    </CardTitle>
                                                    <CardDescription className="text-[10px] font-medium leading-tight mt-1">
                                                        {milestone.subtitle}
                                                    </CardDescription>
                                                </div>
                                            </CardHeader>

                                            <CardContent className="p-4 pt-4 space-y-4">
                                                {/* Checklist */}
                                                <div className="space-y-2">
                                                    {milestone.requirements.map((req, ridx) => (
                                                        <div key={ridx} className="flex items-center gap-3 group/item">
                                                            <div className={cn(
                                                                "w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 transition-all",
                                                                req.done
                                                                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                                                                    : "border-white/10 bg-white/5"
                                                            )}>
                                                                {req.done && <Check className="w-2.5 h-2.5" />}
                                                            </div>
                                                            <span className={cn(
                                                                "text-[10px] leading-snug font-medium transition-colors",
                                                                req.done ? "text-gray-500 line-through" : "text-gray-400 group-hover/item:text-gray-200"
                                                            )}>
                                                                {req.text}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Local Progress Bar */}
                                                <div className="pt-2">
                                                    <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-gray-600 mb-1.5 pl-0.5">
                                                        <span>Progress</span>
                                                        <span className={allDone ? "text-emerald-500" : "text-primary"}>
                                                            {doneCount}/{totalCount} Tasks
                                                        </span>
                                                    </div>
                                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${(doneCount / totalCount) * 100}%` }}
                                                            className={cn(
                                                                "h-full transition-all duration-500",
                                                                allDone ? "bg-emerald-500" : "bg-blue-500"
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            </CardContent>

                                            {/* Rank-Up Shadow Decor */}
                                            <div className={cn(
                                                "absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent transition-opacity duration-700",
                                                allDone ? "opacity-100" : "opacity-0"
                                            )} />
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Mastery & Revenue Simulator */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-10 border-t border-white/5">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black flex items-center gap-3">
                                <Calculator className="w-7 h-7 text-primary" />
                                Revenue & Points Simulator
                            </h3>
                            <p className="text-gray-500 text-sm font-medium">Calculate the ROI and Mastery Points of your sales activity.</p>
                        </div>
                    </div>

                    <Card className="bg-black/60 border-white/10 overflow-hidden">
                        <CardContent className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 pl-1">Target Stage</label>
                                    <Select value={stage} onValueChange={(v) => setStage(v)}>
                                        <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-12">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {STAGES.map((s) => (
                                                <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 pl-1">Touches to Close</label>
                                    <Input
                                        type="number"
                                        value={touches}
                                        onChange={(e) => setTouches(e.target.value)}
                                        min={0}
                                        className="bg-white/5 border-white/10 rounded-xl h-12 [color-scheme:dark]"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 pl-1">Days to Booking</label>
                                    <Input
                                        type="number"
                                        value={daysToBooking}
                                        onChange={(e) => setDaysToBooking(e.target.value)}
                                        min={0}
                                        className="bg-white/5 border-white/10 rounded-xl h-12 [color-scheme:dark]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 bg-black/40 border border-white/10 rounded-3xl relative overflow-hidden group">
                                <div className="text-center md:text-left">
                                    <div className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2 leading-none">Base Value</div>
                                    <motion.div key={simulatorResult.base} initial={{ scale: 1.1 }} animate={{ scale: 1 }} className="text-3xl font-black text-white">
                                        {simulatorResult.base}
                                    </motion.div>
                                </div>
                                <div className="text-center md:text-left">
                                    <div className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2 leading-none text-emerald-500">Eff. Bonus</div>
                                    <motion.div key={simulatorResult.effBonusPct} initial={{ scale: 1.1 }} animate={{ scale: 1 }} className="text-3xl font-black text-emerald-500">
                                        +{simulatorResult.effBonusPct}%
                                    </motion.div>
                                </div>
                                <div className="text-center md:text-left">
                                    <div className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2 leading-none text-blue-500">Speed Multi</div>
                                    <motion.div key={simulatorResult.speedBonusPct} initial={{ scale: 1.1 }} animate={{ scale: 1 }} className="text-3xl font-black text-blue-500">
                                        +{simulatorResult.speedBonusPct}%
                                    </motion.div>
                                </div>
                                <div className="text-center md:text-left border-l border-white/5 md:pl-6 bg-gradient-to-r from-primary/5 to-transparent">
                                    <div className="text-[9px] text-primary font-black uppercase tracking-[0.2em] mb-2 leading-none">Mastery Points</div>
                                    <motion.div key={simulatorResult.total} initial={{ scale: 1.2, color: "#fff" }} animate={{ scale: 1, color: "var(--primary)" }} className="text-4xl font-black text-primary">
                                        {simulatorResult.total}
                                    </motion.div>
                                </div>
                                {/* Background Highlight */}
                                <div className="absolute top-0 right-0 w-32 h-full bg-primary/5 -skew-x-12 transform translate-x-10 pointer-events-none transition-transform group-hover:translate-x-0" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <h4 className="text-xl font-black uppercase tracking-tighter italic">Gamification Rewards</h4>
                    <div className="space-y-4">
                        {[
                            { name: "Momentum Builder", badge: "10 Leads > Identify", icon: TrendingUp },
                            { name: "Human Whisperer", badge: "5 Leads > Human", icon: Users },
                            { name: "Closer x5", badge: "5 Deals Closed", icon: Trophy, special: true },
                            { name: "Speedster", badge: "Close w/in 7 days", icon: Zap },
                        ].map((ach, idx) => (
                            <motion.div
                                key={ach.name}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * idx }}
                                className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between group hover:bg-white/[0.05] hover:border-white/20 transition-all cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-2.5 rounded-xl",
                                        ach.special ? "bg-primary/20 text-primary" : "bg-white/5 text-gray-500 group-hover:text-gray-300"
                                    )}>
                                        <ach.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-black text-sm tracking-tight">{ach.name}</p>
                                        <p className="text-[10px] font-black text-gray-500 group-hover:text-gray-400">{ach.badge}</p>
                                    </div>
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Prestige Summary */}
            <div className="pt-20">
                <Card className="bg-gradient-to-br from-amber-600/10 via-black to-blue-600/5 border-amber-500/20 p-12 overflow-hidden relative shadow-2xl">
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                        <div className="relative">
                            <div className="w-28 h-28 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.2)] animate-pulse">
                                <Crown className="w-14 h-14 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                            </div>
                            <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-blue-500 border-4 border-black flex items-center justify-center text-white font-black text-xs">
                                EX
                            </div>
                        </div>
                        <div className="flex-1 space-y-4 text-center md:text-left">
                            <h3 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
                                Ultimate Prestige: <span className="text-amber-500">Master of Basalt</span>
                            </h3>
                            <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
                                This certification is the culmination of technical excellence and massive output. Reaching Level 25 proves you have mastered every aspect of modern RevOps automation.
                            </p>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
                                {["Lvl 25 Badge", "Global Admin Status", "Prestige UI Skin", "Beta Tester Access"].map(tag => (
                                    <Badge key={tag} className="bg-amber-500/5 text-amber-500 border-amber-500/10 px-4 py-1.5 font-bold text-[11px] uppercase tracking-widest">{tag}</Badge>
                                ))}
                            </div>
                        </div>
                        <button className="px-12 py-6 bg-amber-500 text-black font-black uppercase text-xs tracking-[0.3em] rounded-2xl hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all shadow-[0_10px_40px_rgba(245,158,11,0.3)]">
                            Claim Status
                        </button>
                    </div>

                    {/* Background Decor */}
                    <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-amber-500/5 blur-[120px]" />
                </Card>
            </div>
        </div>
    );
}

const isLocked = (item: typeof MILESTONES[0]) => {
    if (item.id === 1) return false;
    const previousItem = MILESTONES.find(m => m.id === item.id - 1);
    if (!previousItem) return true;
    return !previousItem.requirements.every(r => r.done);
};

function Text({ children, className }: { children: React.ReactNode, className?: string }) {
    return <p className={className}>{children}</p>;
}
