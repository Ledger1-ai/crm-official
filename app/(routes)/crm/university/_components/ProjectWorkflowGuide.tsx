"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    FolderKanban,
    Users,
    ShieldCheck,
    UserCheck,
    Rocket,
    Bell,
    CheckCircle2,
    ArrowRight,
    Crown,
    Building2,
    UserCog,
} from "lucide-react";

const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.4 },
    }),
};

export default function ProjectWorkflowGuide() {
    const roles = [
        {
            title: "Super Admin",
            icon: Crown,
            color: "bg-card",
            borderColor: "border-amber-500/30",
            iconColor: "text-amber-400",
            permissions: [
                "View all campaigns across the entire platform",
                "Create campaigns for any team",
                "Assign admins to campaigns",
                "Monitor all outreach platform-wide",
            ],
        },
        {
            title: "Admin",
            icon: Building2,
            color: "bg-card",
            borderColor: "border-blue-500/30",
            iconColor: "text-blue-400",
            permissions: [
                "View and manage campaigns within your team only",
                "Create campaigns for your team",
                "Create and assign lead pools to members",
                "Assign members to campaigns",
                "Toggle outreach approval on/off per campaign",
            ],
        },
        {
            title: "Member / Sales Rep",
            icon: UserCog,
            color: "bg-card",
            borderColor: "border-emerald-500/30",
            iconColor: "text-emerald-400",
            permissions: [
                "View only campaigns assigned to you",
                "Execute outreach on assigned lead pools",
                "Cannot create lead pools",
                "Cannot modify campaign settings",
            ],
        },
    ];

    const workflowSteps = [
        {
            phase: "Phase 1",
            title: "Campaign Setup",
            actor: "Admin",
            icon: FolderKanban,
            color: "bg-card border-blue-500/20",
            iconColor: "text-blue-400",
            steps: [
                "Admin creates a new campaign with a clear name and description",
                "Admin adds context: target industries, locations, job titles to reach",
                "Admin sets the messaging tone and key talking points",
                "Admin uploads brand assets (logo, colors) if needed",
                "Campaign status starts as DRAFT until ready",
            ],
        },
        {
            phase: "Phase 2",
            title: "Lead Pool & Assignment",
            actor: "Admin",
            icon: Users,
            color: "bg-card border-violet-500/20",
            iconColor: "text-violet-400",
            steps: [
                "Admin creates a lead pool (collection of leads to contact)",
                "Admin imports or generates leads into the pool",
                "Admin assigns the lead pool to one or more members",
                "Admin assigns members to the campaign",
                "Members receive a notification that they've been assigned",
            ],
        },
        {
            phase: "Phase 3",
            title: "Outreach Execution",
            actor: "Member",
            icon: Rocket,
            color: "bg-card border-emerald-500/20",
            iconColor: "text-emerald-400",
            steps: [
                "Member opens 'My Campaigns' dashboard",
                "Member sees assigned campaigns and pools",
                "Member clicks 'Start Outreach' on an assigned pool",
                "Outreach wizard opens with campaign context pre-filled",
                "Member reviews, customizes, and launches the outreach",
            ],
        },
        {
            phase: "Phase 4",
            title: "Approval (Optional)",
            actor: "Admin decides",
            icon: ShieldCheck,
            color: "bg-card border-amber-500/20",
            iconColor: "text-amber-400",
            steps: [
                "Admin can require approval before outreach goes live",
                "This is a toggle in campaign settings (case by case)",
                "If ON: member submits outreach for review",
                "Admin approves or requests changes",
                "If OFF: member can launch immediately",
            ],
        },
        {
            phase: "Phase 5",
            title: "Monitoring",
            actor: "Everyone",
            icon: Bell,
            color: "bg-card border-rose-500/20",
            iconColor: "text-rose-400",
            steps: [
                "Members see stats for their own outreach",
                "Admins see all outreach stats for their team",
                "Super Admins see platform-wide analytics",
                "All leads remain owned by admin for continuity",
            ],
        },
    ];

    const keyRules = [
        {
            title: "Lead Ownership",
            description: "All leads are owned by the admin who created them. If a member leaves, leads stay with the team.",
            icon: UserCheck,
        },
        {
            title: "Pool Restrictions",
            description: "Only admins can create lead pools. Members work with pools assigned to them by their admin.",
            icon: ShieldCheck,
        },
        {
            title: "Campaign Context Flows Down",
            description: "When a member starts outreach, the campaign's context (ICP, messaging, etc.) is automatically applied.",
            icon: ArrowRight,
        },
    ];

    return (
        <div className="space-y-8">
            {/* Hero */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
            >
                <Card className="bg-gradient-to-br from-card via-background to-muted/20 border-primary/10 shadow-xl shadow-primary/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
                    <div className="flex flex-col items-center justify-center p-4 text-center space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                <FolderKanban className="w-4 h-4" />
                            </div>
                            <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
                                Campaign Workflow Guide
                            </h2>
                        </div>
                        <p className="text-sm text-muted-foreground w-full">
                            How campaigns, lead pools, and outreach flow from admin setup to member execution.
                        </p>
                    </div>
                </Card>
            </motion.div>

            {/* Role Permissions */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Crown className="w-5 h-5 text-muted-foreground" />
                    Who Can Do What
                </h3>
                <div className="grid gap-4 md:grid-cols-3">
                    {roles.map((role, index) => {
                        const Icon = role.icon;
                        return (
                            <motion.div
                                key={role.title}
                                custom={index}
                                initial="hidden"
                                animate="visible"
                                variants={sectionVariants}
                            >
                                <Card className={`h-full bg-card ${role.borderColor} border`}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-lg bg-background/50 ${role.iconColor}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <CardTitle className="text-base">{role.title}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {role.permissions.map((perm, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm">
                                                    <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${role.iconColor}`} />
                                                    <span className="text-muted-foreground">{perm}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Visual Flow Summary */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <Card className="bg-gradient-to-br from-card via-background to-muted/20 border-primary/10 shadow-xl shadow-primary/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 p-4 md:p-6">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap mr-2">
                            Quick Summary:
                        </h4>
                        <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-medium">
                            {[
                                { label: "Admin creates Campaign", color: "border-blue-500 text-blue-500 hover:bg-blue-500" },
                                { label: "Admin creates Lead Pool", color: "border-violet-500 text-violet-500 hover:bg-violet-500" },
                                { label: "Admin assigns to Member", color: "border-indigo-500 text-indigo-500 hover:bg-indigo-500" },
                                { label: "Member runs Outreach", color: "border-emerald-500 text-emerald-500 hover:bg-emerald-500" },
                            ].map((step, i) => (
                                <React.Fragment key={step.label}>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "py-1.5 px-4 text-sm font-medium transition-all duration-300 border bg-background/50 hover:text-white cursor-default",
                                            step.color
                                        )}
                                    >
                                        {step.label}
                                    </Badge>
                                    {i < 3 && <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Workflow Steps */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-muted-foreground" />
                    Step-by-Step Workflow
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {workflowSteps.map((phase, index) => {
                        const Icon = phase.icon;
                        const isLast = index === workflowSteps.length - 1;

                        return (
                            <motion.div
                                key={phase.phase}
                                custom={index}
                                initial="hidden"
                                animate="visible"
                                variants={sectionVariants}
                                className={cn(isLast && "md:col-span-2 md:w-2/3 md:mx-auto")}
                            >
                                <Card className={`${phase.color} border h-full`}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg bg-background/50 ${phase.iconColor}`}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <Badge variant="outline" className="mb-1">{phase.phase}</Badge>
                                                    <CardTitle className="text-base">{phase.title}</CardTitle>
                                                </div>
                                            </div>
                                            <Badge variant="secondary">{phase.actor}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <ol className="space-y-2">
                                            {phase.steps.map((step, i) => (
                                                <li key={i} className="flex items-start gap-3 text-sm">
                                                    <span className={`w-5 h-5 rounded-full bg-background/80 flex items-center justify-center text-xs font-semibold flex-shrink-0 ${phase.iconColor}`}>
                                                        {i + 1}
                                                    </span>
                                                    <span className="text-muted-foreground">{step}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Key Rules */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-muted-foreground" />
                    Key Rules to Remember
                </h3>
                <div className="grid gap-4 md:grid-cols-3">
                    {keyRules.map((rule, index) => {
                        const Icon = rule.icon;
                        return (
                            <motion.div
                                key={rule.title}
                                custom={index}
                                initial="hidden"
                                animate="visible"
                                variants={sectionVariants}
                            >
                                <Card className="h-full bg-card border-border">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center gap-2">
                                            <Icon className="w-5 h-5 text-primary" />
                                            <CardTitle className="text-sm">{rule.title}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            </div>


        </div>
    );
}
