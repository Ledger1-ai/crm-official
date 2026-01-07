"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
            color: "from-amber-500/20 to-yellow-500/20",
            borderColor: "border-amber-500/30",
            iconColor: "text-amber-400",
            permissions: [
                "View all projects across the entire platform",
                "Create projects for any team",
                "Assign admins to projects",
                "Monitor all campaigns platform-wide",
            ],
        },
        {
            title: "Admin",
            icon: Building2,
            color: "from-blue-500/20 to-indigo-500/20",
            borderColor: "border-blue-500/30",
            iconColor: "text-blue-400",
            permissions: [
                "View and manage projects within your team only",
                "Create projects for your team",
                "Create and assign lead pools to members",
                "Assign members to projects",
                "Toggle campaign approval on/off per project",
            ],
        },
        {
            title: "Member / Sales Rep",
            icon: UserCog,
            color: "from-emerald-500/20 to-green-500/20",
            borderColor: "border-emerald-500/30",
            iconColor: "text-emerald-400",
            permissions: [
                "View only projects assigned to you",
                "Execute campaigns on assigned lead pools",
                "Cannot create lead pools",
                "Cannot modify project settings",
            ],
        },
    ];

    const workflowSteps = [
        {
            phase: "Phase 1",
            title: "Project Setup",
            actor: "Admin",
            icon: FolderKanban,
            color: "bg-blue-500/10 border-blue-500/20",
            iconColor: "text-blue-400",
            steps: [
                "Admin creates a new project with a clear name and description",
                "Admin adds context: target industries, locations, job titles to reach",
                "Admin sets the messaging tone and key talking points",
                "Admin uploads brand assets (logo, colors) if needed",
                "Project status starts as DRAFT until ready",
            ],
        },
        {
            phase: "Phase 2",
            title: "Lead Pool & Assignment",
            actor: "Admin",
            icon: Users,
            color: "bg-violet-500/10 border-violet-500/20",
            iconColor: "text-violet-400",
            steps: [
                "Admin creates a lead pool (collection of leads to contact)",
                "Admin imports or generates leads into the pool",
                "Admin assigns the lead pool to one or more members",
                "Admin assigns members to the project",
                "Members receive a notification that they've been assigned",
            ],
        },
        {
            phase: "Phase 3",
            title: "Campaign Execution",
            actor: "Member",
            icon: Rocket,
            color: "bg-emerald-500/10 border-emerald-500/20",
            iconColor: "text-emerald-400",
            steps: [
                "Member opens 'My Projects' dashboard",
                "Member sees assigned projects and pools",
                "Member clicks 'Start Campaign' on an assigned pool",
                "Campaign wizard opens with project context pre-filled",
                "Member reviews, customizes, and launches the campaign",
            ],
        },
        {
            phase: "Phase 4",
            title: "Approval (Optional)",
            actor: "Admin decides",
            icon: ShieldCheck,
            color: "bg-amber-500/10 border-amber-500/20",
            iconColor: "text-amber-400",
            steps: [
                "Admin can require approval before campaigns go live",
                "This is a toggle in project settings (case by case)",
                "If ON: member submits campaign for review",
                "Admin approves or requests changes",
                "If OFF: member can launch immediately",
            ],
        },
        {
            phase: "Phase 5",
            title: "Monitoring",
            actor: "Everyone",
            icon: Bell,
            color: "bg-rose-500/10 border-rose-500/20",
            iconColor: "text-rose-400",
            steps: [
                "Members see stats for their own campaigns",
                "Admins see all campaign stats for their team",
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
            title: "Project Context Flows Down",
            description: "When a member starts a campaign, the project's context (ICP, messaging, etc.) is automatically applied.",
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
                <Card className="bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border-none overflow-hidden">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <FolderKanban className="w-6 h-6 text-indigo-400" />
                            Project Workflow Guide
                        </CardTitle>
                        <CardDescription className="text-base">
                            How projects, lead pools, and campaigns flow from admin setup to member execution.
                        </CardDescription>
                    </CardHeader>
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
                                <Card className={`h-full bg-gradient-to-br ${role.color} ${role.borderColor} border`}>
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
                <Card className="bg-gradient-to-r from-slate-500/5 to-transparent">
                    <CardHeader>
                        <CardTitle className="text-base">Quick Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 py-1.5 px-3">
                                Admin creates Project
                            </Badge>
                            <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
                            <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 py-1.5 px-3">
                                Admin creates Lead Pool
                            </Badge>
                            <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
                            <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 py-1.5 px-3">
                                Admin assigns to Member
                            </Badge>
                            <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 py-1.5 px-3">
                                Member runs Campaign
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Workflow Steps */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-muted-foreground" />
                    Step-by-Step Workflow
                </h3>
                <div className="space-y-4">
                    {workflowSteps.map((phase, index) => {
                        const Icon = phase.icon;
                        return (
                            <motion.div
                                key={phase.phase}
                                custom={index}
                                initial="hidden"
                                animate="visible"
                                variants={sectionVariants}
                            >
                                <Card className={`${phase.color} border`}>
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
                                <Card className="h-full bg-muted/30">
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
