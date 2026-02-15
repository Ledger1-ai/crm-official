"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    BookOpen,
    Video,
    Trophy,
    GraduationCap,
    PlayCircle,
    FileText,
    GitBranch,
    Layers,
    Workflow,
    FolderKanban,
    BarChart3,
    ShieldCheck,
    Database,
    Share2,
    Bot,
    ArrowRight,
    Medal,
} from "lucide-react";
import Heading from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";

// New Phase 1 components
import ComplianceAcademy from "./ComplianceAcademy";
import DataHealthDashboard from "./DataHealthDashboard";

// New Phase 2 components
import RevOpsSimulator from "./RevOpsSimulator";
import IntegrationBlueprints from "./IntegrationBlueprints";

// New Phase 3 components
import CertificationPaths from "./CertificationPaths";
import AIPromptLab from "./AIPromptLab";

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

type TabId = "flow" | "reference" | "project-workflow" | "compliance" | "data-health" | "roi-modeler" | "architecture" | "certification" | "prompt-lab";

// Page transition variants
const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
};

export default function UniversityDashboard() {
    const [activeTab, setActiveTab] = useState<TabId>("project-workflow");
    const [activeStage, setActiveStage] = useState<string | undefined>(undefined);

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
            id: "compliance" as TabId,
            label: "Compliance Academy",
            icon: ShieldCheck,
            color: "text-blue-400 group-hover:text-blue-300",
            gradient: "from-blue-600/30 via-blue-500/10 to-transparent",
            borderColor: "border-blue-500/50 ring-blue-500/20",
            shadowColor: "shadow-blue-500/20"
        },
        {
            id: "data-health" as TabId,
            label: "Data Health",
            icon: Database,
            color: "text-emerald-400 group-hover:text-emerald-300",
            gradient: "from-emerald-600/30 via-emerald-500/10 to-transparent",
            borderColor: "border-emerald-500/50 ring-emerald-500/20",
            shadowColor: "shadow-emerald-500/20"
        },
        {
            id: "certification" as TabId,
            label: "Mastery Paths",
            icon: GraduationCap,
            color: "text-blue-400 group-hover:text-blue-300",
            gradient: "from-blue-600/30 via-blue-500/10 to-transparent",
            borderColor: "border-blue-500/50 ring-blue-500/20",
            shadowColor: "shadow-blue-500/20"
        },
        {
            id: "prompt-lab" as TabId,
            label: "Persona Playbook",
            icon: Bot,
            color: "text-emerald-400 group-hover:text-emerald-300",
            gradient: "from-emerald-600/30 via-emerald-500/10 to-transparent",
            borderColor: "border-emerald-500/50 ring-emerald-500/20",
            shadowColor: "shadow-emerald-500/20"
        },
        {
            id: "roi-modeler" as TabId,
            label: "ROI Modeler",
            icon: BarChart3,
            color: "text-emerald-400 group-hover:text-emerald-300",
            gradient: "from-emerald-600/30 via-emerald-500/10 to-transparent",
            borderColor: "border-emerald-500/50 ring-emerald-500/20",
            shadowColor: "shadow-emerald-500/20"
        },
        {
            id: "architecture" as TabId,
            label: "Architecture",
            icon: Share2,
            color: "text-violet-400 group-hover:text-violet-300",
            gradient: "from-violet-600/30 via-violet-500/10 to-transparent",
            borderColor: "border-violet-500/50 ring-violet-500/20",
            shadowColor: "shadow-violet-500/20"
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
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-9 gap-3 md:gap-4 mb-8 bg-transparent"
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
                            <Card className="bg-card border-border overflow-hidden">
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

                {/* Compliance Academy Tab */}
                {activeTab === "compliance" && (
                    <motion.div
                        key="compliance"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                    >
                        <ComplianceAcademy />
                    </motion.div>
                )}

                {/* Data Health Tab */}
                {activeTab === "data-health" && (
                    <motion.div
                        key="data-health"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                    >
                        <DataHealthDashboard />
                    </motion.div>
                )}

                {/* Mastery Paths Tab */}
                {activeTab === "certification" && (
                    <motion.div
                        key="certification"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                    >
                        <CertificationPaths />
                    </motion.div>
                )}

                {/* Persona Playbook Tab */}
                {activeTab === "prompt-lab" && (
                    <motion.div
                        key="prompt-lab"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                    >
                        <AIPromptLab />
                    </motion.div>
                )}

                {/* ROI Modeler Tab */}
                {activeTab === "roi-modeler" && (
                    <motion.div
                        key="roi-modeler"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                    >
                        <RevOpsSimulator />
                    </motion.div>
                )}

                {/* Architecture Tab */}
                {activeTab === "architecture" && (
                    <motion.div
                        key="architecture"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                    >
                        <IntegrationBlueprints />
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
                        <Card className="bg-card border-border">
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
                                    className="p-4 rounded-lg bg-card border border-border"
                                >
                                    <h4 className="font-semibold text-sm text-blue-500">Lead → Contact & Opportunity</h4>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        When you click <strong>Convert</strong> on a qualified lead, it becomes an <strong>Opportunity</strong> (for your pipeline) and a <strong>Contact</strong> (for unique identity).
                                    </p>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="p-4 rounded-lg bg-card border border-border"
                                >
                                    <h4 className="font-semibold text-sm text-emerald-500">Opportunity → Account</h4>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        When you <strong>Close Won</strong> an Opportunity, it automatically creates an <strong>Account</strong>.
                                        Congratulations – they're now a customer!
                                    </p>
                                </motion.div>
                            </CardContent>
                        </Card>

                        <div className="pt-10 border-t border-white/5 space-y-8">
                            <div>
                                <h3 className="text-2xl font-black flex items-center gap-3">
                                    <GraduationCap className="w-7 h-7 text-primary" />
                                    Learning Center
                                </h3>
                                <p className="text-gray-400 text-sm mt-1">Master BasaltCRM with these essential guides and tutorials.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Video Tutorials */}
                                <Card className="bg-white/5 border-white/10">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex items-center gap-2 font-bold">
                                            <Video className="w-5 h-5 text-blue-500" />
                                            Video Academy
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-4">
                                        <motion.div
                                            whileHover={{ scale: 1.02 }}
                                            className="flex items-start gap-4 p-4 rounded-xl border border-white/10 bg-black/20 hover:bg-white/[0.05] transition-all cursor-pointer group"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20">
                                                <PlayCircle className="w-5 h-5 text-blue-500" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm">CRM Walkthrough</h4>
                                                <p className="text-[11px] text-gray-500 mt-1">A 5-minute tour of the main dashboard.</p>
                                            </div>
                                        </motion.div>
                                        <motion.div
                                            whileHover={{ scale: 1.02 }}
                                            className="flex items-start gap-4 p-4 rounded-xl border border-white/10 bg-black/20 hover:bg-white/[0.05] transition-all cursor-pointer group"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20">
                                                <PlayCircle className="w-5 h-5 text-emerald-500" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm">Lead Management</h4>
                                                <p className="text-[11px] text-gray-500 mt-1">Import, assign, and track effectively.</p>
                                            </div>
                                        </motion.div>
                                    </CardContent>
                                </Card>

                                {/* Written Guides */}
                                <Card className="bg-white/5 border-white/10">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex items-center gap-2 font-bold">
                                            <FileText className="w-5 h-5 text-amber-500" />
                                            Technical Docs
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-3">
                                        {[
                                            "Configuring your email signature",
                                            "Understanding pipeline stages",
                                            "Using the AI Dialer effectively",
                                            "Advanced API integrations"
                                        ].map((title, i) => (
                                            <motion.div key={i} whileHover={{ x: 4 }} className="flex items-center gap-2 p-2 text-sm font-medium hover:text-white cursor-pointer transition-all border-b border-white/5 last:border-0 pb-3">
                                                <ArrowRight className="w-3 h-3 text-amber-500" />
                                                {title}
                                            </motion.div>
                                        ))}
                                    </CardContent>
                                </Card>

                                {/* Best Practices */}
                                <Card className="bg-white/5 border-white/10">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex items-center gap-2 font-bold">
                                            <Trophy className="w-5 h-5 text-emerald-500" />
                                            Strategic Advisor
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-xs text-gray-400">Advanced strategies for high-performing teams.</p>
                                        <div className="space-y-3">
                                            {[
                                                { label: "The Art of Follow-up", color: "text-blue-400" },
                                                { label: "Handling Objections", color: "text-red-400" },
                                                { label: "Closing Techniques", color: "text-emerald-400" }
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-center gap-3">
                                                    <div className={cn("w-1.5 h-1.5 rounded-full bg-current", item.color)} />
                                                    <span className="text-xs font-bold">{item.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
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
                                description="How projects, pools, and outreach allow for scalable outreach."
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


            </AnimatePresence>
        </div>
    );
}
