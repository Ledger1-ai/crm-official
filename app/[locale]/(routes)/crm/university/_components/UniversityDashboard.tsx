"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    BookOpen,
    Video,
    Trophy,
    Calculator,
    GraduationCap,
    PlayCircle,
    FileText,
    GitBranch,
    Layers,
    Workflow,
    FolderKanban,
    BarChart3,
} from "lucide-react";
import Heading from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";

// New flow components
import FlowDiagramCard, { PIPELINE_LEGEND, CONVERSION_LEGEND } from "./FlowDiagramCard";
import PipelineFlow, { PIPELINE_STAGES } from "./PipelineStageCard";
import EntityRelationshipView from "./EntityRelationshipView";
import OutreachFlowView from "./OutreachFlowView";
import { MermaidDiagram, CRM_FLOW_DIAGRAM, CONVERSION_FLOW_DIAGRAM, CRM_FLOW_DIAGRAM_MOBILE, CONVERSION_FLOW_DIAGRAM_MOBILE } from "./MermaidDiagram";
import AutoConversionFlow from "./AutoConversionFlow";
import FlowStatsCharts from "./FlowStatsCharts";
import ProjectWorkflowGuide from "./ProjectWorkflowGuide";
import { PROJECT_WORKFLOW_DESKTOP, PROJECT_WORKFLOW_MOBILE, PROJECT_WORKFLOW_LEGEND } from "./ProjectWorkflowDiagrams";
import TabNavigationCard from "./TabNavigationCard";

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

type TabId = "flow" | "reference" | "project-workflow" | "lms" | "gamification";

// Page transition variants
const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
};

export default function UniversityDashboard() {
    const [activeTab, setActiveTab] = useState<TabId>("project-workflow");
    const [activeStage, setActiveStage] = useState<string | undefined>(undefined);

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
            effBonus = clamp(0, (3 - t) / 10, 0.3);
            if (!Number.isNaN(d)) {
                speedBonus = clamp(0, (14 - d) / 20, 0.7);
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

    const tabs = [
        {
            id: "project-workflow" as TabId,
            label: "Project Workflow",
            icon: FolderKanban,
            color: "text-indigo-400 group-hover:text-indigo-300",
            gradient: "from-indigo-600/30 via-indigo-500/10 to-transparent",
            borderColor: "border-indigo-500/50 ring-indigo-500/20",
            shadowColor: "shadow-indigo-500/20"
        },
        {
            id: "flow" as TabId,
            label: "Flow Architecture",
            icon: GitBranch,
            color: "text-blue-400 group-hover:text-blue-300",
            gradient: "from-blue-600/30 via-blue-500/10 to-transparent",
            borderColor: "border-blue-500/50 ring-blue-500/20",
            shadowColor: "shadow-blue-500/20"
        },
        {
            id: "reference" as TabId,
            label: "Quick Reference",
            icon: Layers,
            color: "text-emerald-400 group-hover:text-emerald-300",
            gradient: "from-emerald-600/30 via-emerald-500/10 to-transparent",
            borderColor: "border-emerald-500/50 ring-emerald-500/20",
            shadowColor: "shadow-emerald-500/20"
        },
        {
            id: "lms" as TabId,
            label: "Learning Center",
            icon: BookOpen,
            color: "text-violet-400 group-hover:text-violet-300",
            gradient: "from-violet-600/30 via-violet-500/10 to-transparent",
            borderColor: "border-violet-500/50 ring-violet-500/20",
            shadowColor: "shadow-violet-500/20"
        },
        {
            id: "gamification" as TabId,
            label: "Gamification",
            icon: Trophy,
            color: "text-amber-400 group-hover:text-amber-300",
            gradient: "from-amber-600/30 via-amber-500/10 to-transparent",
            borderColor: "border-amber-500/50 ring-amber-500/20",
            shadowColor: "shadow-amber-500/20"
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col"
            >
                <Heading
                    title="CRM University"
                    description="Master the complete lead-to-sale flow, track your performance, and level up your sales game."
                />
                <Separator className="mt-4" />
            </motion.div>

            {/* Navigation Cards Grid */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-8 bg-transparent"
            >
                {tabs.map((tab, index) => (
                    <TabNavigationCard
                        key={tab.id}
                        id={tab.id}
                        label={tab.label}
                        icon={tab.icon}
                        color={tab.color}
                        gradient={tab.gradient}
                        borderColor={tab.borderColor}
                        shadowColor={tab.shadowColor}
                        isActive={activeTab === tab.id}
                        onClick={() => setActiveTab(tab.id)}
                    />
                ))}
            </motion.div>

            {/* Tab Content with AnimatePresence */}
            <AnimatePresence mode="wait">
                {/* Flow Architecture Tab */}
                {activeTab === "flow" && (
                    <motion.div
                        key="flow"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                        className="space-y-8"
                    >
                        {/* Hero Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                        >
                            <Card className="bg-gradient-to-r from-blue-500/10 via-violet-500/5 to-transparent border-none overflow-hidden">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Workflow className="w-6 h-6 text-primary" />
                                        CRM Flow Architecture
                                    </CardTitle>
                                    <CardDescription>
                                        Understand how leads flow through the pipeline and convert into customers.
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </motion.div>

                        {/* Main Pipeline Mermaid Diagram */}
                        <FlowDiagramCard
                            title="Complete CRM Pipeline Flow"
                            description="Interactive diagram showing lead acquisition through post-sale"
                            accentColor="blue"
                            legend={PIPELINE_LEGEND}
                        >
                            <MermaidDiagram chart={CRM_FLOW_DIAGRAM} mobileChart={CRM_FLOW_DIAGRAM_MOBILE} />
                        </FlowDiagramCard>

                        {/* Stats Charts */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-muted-foreground" />
                                Pipeline Analytics (Sample Data)
                            </h3>
                            <FlowStatsCharts />
                        </motion.div>

                        {/* Auto-Conversion Flow */}
                        <FlowDiagramCard
                            title="Auto-Conversion Rules"
                            description="How leads automatically convert to contacts and accounts"
                            accentColor="emerald"
                        >
                            <AutoConversionFlow />
                        </FlowDiagramCard>

                        {/* Conversion Mermaid Diagram */}
                        <FlowDiagramCard
                            title="Conversion Flow Diagram"
                            description="See how leads automatically become contacts and accounts"
                            accentColor="violet"
                            legend={CONVERSION_LEGEND}
                        >
                            <MermaidDiagram chart={CONVERSION_FLOW_DIAGRAM} mobileChart={CONVERSION_FLOW_DIAGRAM_MOBILE} />
                        </FlowDiagramCard>

                        {/* Entity Relationships */}
                        <FlowDiagramCard
                            title="Entity Relationships"
                            description="How CRM entities connect and convert"
                            accentColor="amber"
                        >
                            <EntityRelationshipView />
                        </FlowDiagramCard>

                        {/* Outreach Channels */}
                        <FlowDiagramCard
                            title="Outreach Channels"
                            description="Communication endpoints and their triggers"
                            accentColor="rose"
                        >
                            <OutreachFlowView />
                        </FlowDiagramCard>
                    </motion.div>
                )}

                {/* Quick Reference Tab */}
                {activeTab === "reference" && (
                    <motion.div
                        key="reference"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        <Card className="bg-gradient-to-r from-emerald-500/10 to-transparent border-none">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Layers className="w-6 h-6 text-emerald-500" />
                                    Quick Reference
                                </CardTitle>
                                <CardDescription>
                                    Essential information at a glance
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        {/* Interactive Pipeline Explorer */}
                        <FlowDiagramCard
                            title="Interactive Pipeline Explorer"
                            description="Click any stage to see detailed activities"
                            accentColor="blue"
                        >
                            <PipelineFlow
                                activeStage={activeStage}
                                onStageClick={(id) => setActiveStage(activeStage === id ? undefined : id)}
                            />
                        </FlowDiagramCard>

                        {/* Stage Overview Grid */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {PIPELINE_STAGES.map((stg, index) => {
                                const Icon = stg.icon;
                                return (
                                    <motion.div
                                        key={stg.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Card className={`${stg.bgColor} ${stg.borderColor} border h-full`}>
                                            <CardHeader className="pb-2">
                                                <div className="flex items-center gap-2">
                                                    <Icon className={`w-5 h-5 ${stg.color}`} />
                                                    <CardTitle className={`text-sm ${stg.color}`}>
                                                        {stg.displayName}
                                                    </CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-xs text-muted-foreground mb-3">{stg.description}</p>
                                                <div className="space-y-1">
                                                    {stg.activities.map((act, i) => (
                                                        <div key={i} className="text-xs flex items-center gap-2">
                                                            <span className={`w-1.5 h-1.5 rounded-full ${stg.color.replace("text-", "bg-")}`} />
                                                            {act}
                                                        </div>
                                                    ))}
                                                </div>
                                                {stg.triggerNote && (
                                                    <Badge variant="outline" className="mt-3 text-xs">
                                                        {stg.triggerNote}
                                                    </Badge>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Conversion Rules - Plain English */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">What Happens Automatically</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2">
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20"
                                >
                                    <h4 className="font-semibold text-sm text-blue-500">Lead → Contact</h4>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        When you send your first email or text message to a lead, they automatically become a <strong>Contact</strong>.
                                        This means they've received your outreach!
                                    </p>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20"
                                >
                                    <h4 className="font-semibold text-sm text-emerald-500">Lead → Account</h4>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        When you close a deal, the lead becomes an <strong>Account</strong>.
                                        Congratulations – they're now a customer!
                                    </p>
                                </motion.div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Project Workflow Tab */}
                {activeTab === "project-workflow" && (
                    <motion.div
                        key="project-workflow"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                    >
                        <ProjectWorkflowGuide />

                        <div className="mt-8">
                            <FlowDiagramCard
                                title="Visual Workflow: From Setup to Launch"
                                description="How projects, pools, and campaigns allow for scalable outreach."
                                accentColor="blue"
                                legend={PROJECT_WORKFLOW_LEGEND}
                            >
                                <MermaidDiagram
                                    chart={PROJECT_WORKFLOW_DESKTOP}
                                    mobileChart={PROJECT_WORKFLOW_MOBILE}
                                />
                            </FlowDiagramCard>
                        </div>
                    </motion.div>
                )}

                {/* LMS Section */}
                {activeTab === "lms" && (
                    <motion.div
                        key="lms"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                    >
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
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20">
                                        <PlayCircle className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm">CRM Walkthrough</h4>
                                        <p className="text-xs text-muted-foreground mt-1">A 5-minute tour of the main dashboard and features.</p>
                                    </div>
                                </motion.div>
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20">
                                        <PlayCircle className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm">Lead Management 101</h4>
                                        <p className="text-xs text-muted-foreground mt-1">How to import, assign, and track leads effectively.</p>
                                    </div>
                                </motion.div>
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
                                <motion.div whileHover={{ x: 4 }} className="p-3 text-sm font-medium hover:underline cursor-pointer transition-all">
                                    How to configure your email signature
                                </motion.div>
                                <div className="h-px bg-border/50" />
                                <motion.div whileHover={{ x: 4 }} className="p-3 text-sm font-medium hover:underline cursor-pointer transition-all">
                                    Understanding pipeline stages
                                </motion.div>
                                <div className="h-px bg-border/50" />
                                <motion.div whileHover={{ x: 4 }} className="p-3 text-sm font-medium hover:underline cursor-pointer transition-all">
                                    Using the AI Dialer
                                </motion.div>
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
                    </motion.div>
                )}

                {/* Gamification Section */}
                {activeTab === "gamification" && (
                    <motion.div
                        key="gamification"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Points Calculator */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                            >
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

                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg"
                                        >
                                            <div className="text-center">
                                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Base</div>
                                                <motion.div
                                                    key={result.base}
                                                    initial={{ scale: 1.2 }}
                                                    animate={{ scale: 1 }}
                                                    className="text-xl font-bold"
                                                >
                                                    {result.base}
                                                </motion.div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Eff. Bonus</div>
                                                <motion.div
                                                    key={result.effBonusPct}
                                                    initial={{ scale: 1.2 }}
                                                    animate={{ scale: 1 }}
                                                    className="text-xl font-bold text-emerald-500"
                                                >
                                                    +{result.effBonusPct}%
                                                </motion.div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Speed Bonus</div>
                                                <motion.div
                                                    key={result.speedBonusPct}
                                                    initial={{ scale: 1.2 }}
                                                    animate={{ scale: 1 }}
                                                    className="text-xl font-bold text-blue-500"
                                                >
                                                    +{result.speedBonusPct}%
                                                </motion.div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Total</div>
                                                <motion.div
                                                    key={result.total}
                                                    initial={{ scale: 1.3 }}
                                                    animate={{ scale: 1 }}
                                                    className="text-2xl font-black text-primary"
                                                >
                                                    {result.total}
                                                </motion.div>
                                            </div>
                                        </motion.div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Achievement Rules */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Achievements & Milestones</CardTitle>
                                        <CardDescription>Unlock badges by hitting these targets.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4 text-sm">
                                        {[
                                            { name: "Momentum Builder", badge: "10 Leads > Identify", variant: "secondary" as const },
                                            { name: "Human Whisperer", badge: "5 Leads > Human", variant: "secondary" as const },
                                            { name: "Closer x5", badge: "5 Deals Closed", variant: "outline" as const, special: true },
                                            { name: "Speedster", badge: "Close w/in 7 days", variant: "secondary" as const },
                                        ].map((achievement, index) => (
                                            <motion.div
                                                key={achievement.name}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3 + index * 0.1 }}
                                                whileHover={{ scale: 1.02, x: 4 }}
                                                className="flex items-center justify-between p-2 border rounded hover:bg-muted/50 cursor-pointer transition-colors"
                                            >
                                                <span className="font-semibold">{achievement.name}</span>
                                                <Badge
                                                    variant={achievement.variant}
                                                    className={achievement.special ? "border-primary text-primary" : ""}
                                                >
                                                    {achievement.badge}
                                                </Badge>
                                            </motion.div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
