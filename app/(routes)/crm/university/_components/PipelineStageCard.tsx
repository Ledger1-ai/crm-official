"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    Search,
    Bot,
    Phone,
    FileText,
    ClipboardCheck,
    CheckCircle2,
    ChevronRight,
    Sparkles,
    LucideIcon,
} from "lucide-react";

export interface PipelineStage {
    id: string;
    name: string;
    displayName: string;
    description: string;
    activities: string[];
    triggerNote?: string;
    triggerIcon?: LucideIcon;
    icon: LucideIcon;
    color: string;
    bgColor: string;
    borderColor: string;
}

export const PIPELINE_STAGES: PipelineStage[] = [
    {
        id: "Identify",
        name: "Identify",
        displayName: "1. Identify",
        description: "New lead! We're learning about them and checking if they're a good fit.",
        activities: ["AI scores the lead", "Finds key signals", "Enriches their profile"],
        icon: Search,
        color: "text-sky-500",
        bgColor: "bg-sky-500/10",
        borderColor: "border-sky-500/30",
    },
    {
        id: "Engage_AI",
        name: "Engage_AI",
        displayName: "2. AI Outreach",
        description: "AI sends the first message – email or text, personalized for them.",
        activities: ["AI writes the perfect email", "Tracks when they open it", "Includes your calendar link"],
        triggerNote: "They become a Contact automatically",
        triggerIcon: Sparkles,
        icon: Bot,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/30",
    },
    {
        id: "Engage_Human",
        name: "Engage_Human",
        displayName: "3. Your Turn",
        description: "Time for you to step in! Call them, build the relationship.",
        activities: ["Make calls with AI coaching", "Get live transcription", "Deeper conversations"],
        icon: Phone,
        color: "text-indigo-500",
        bgColor: "bg-indigo-500/10",
        borderColor: "border-indigo-500/30",
    },
    {
        id: "Offering",
        name: "Offering",
        displayName: "4. Offering",
        description: "Show them what you've got – proposals, pricing, demos.",
        activities: ["Share proposals", "Send follow-up texts", "Share documents"],
        icon: FileText,
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
        borderColor: "border-purple-500/30",
    },
    {
        id: "Finalizing",
        name: "Finalizing",
        displayName: "5. Finalizing",
        description: "Almost there! Contracts, invoices, final details.",
        activities: ["Send invoice links", "Upload contracts", "Final negotiations"],
        icon: ClipboardCheck,
        color: "text-pink-500",
        bgColor: "bg-pink-500/10",
        borderColor: "border-pink-500/30",
    },
    {
        id: "Closed",
        name: "Closed",
        displayName: "6. Closed Won",
        description: "Congratulations! They're now a paying customer!",
        activities: ["A new Project is created", "Celebrate your win", "Team is assigned"],
        triggerNote: "Project created automatically",
        triggerIcon: Sparkles,
        icon: CheckCircle2,
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/30",
    },
];

interface PipelineStageCardProps {
    stage: PipelineStage;
    isActive?: boolean;
    onClick?: () => void;
    delay?: number;
    showArrow?: boolean;
}

export function PipelineStageCard({
    stage,
    isActive = false,
    onClick,
    delay = 0,
    showArrow = true,
}: PipelineStageCardProps) {
    const Icon = stage.icon;
    const TriggerIcon = stage.triggerIcon || Sparkles;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay }}
            className="flex items-stretch"
        >
            <div
                onClick={onClick}
                className={cn(
                    "flex-1 p-4 rounded-xl border transition-all cursor-pointer",
                    "hover:shadow-lg hover:scale-[1.02]",
                    "bg-card",
                    stage.borderColor,
                    isActive && "ring-2 ring-primary shadow-lg"
                )}
            >
                <div className="flex items-start gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                        "bg-background border",
                        stage.borderColor
                    )}>
                        <Icon className={cn("w-5 h-5", stage.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className={cn("font-semibold text-sm", stage.color)}>
                            {stage.displayName}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {stage.description}
                        </p>
                        {stage.triggerNote && (
                            <div className="mt-2 text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                                <TriggerIcon className="w-3 h-3" />
                                {stage.triggerNote}
                            </div>
                        )}
                    </div>
                </div>

                {isActive && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-3 pt-3 border-t border-current/10"
                    >
                        <p className="text-xs font-medium text-muted-foreground mb-2">What happens here:</p>
                        <ul className="space-y-1">
                            {stage.activities.map((activity, i) => (
                                <li key={i} className="text-sm flex items-center gap-2">
                                    <span className={cn("w-1.5 h-1.5 rounded-full", stage.color.replace("text-", "bg-"))} />
                                    {activity}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </div>

            {showArrow && (
                <div className="flex items-center px-2">
                    <ChevronRight className="w-4 h-4 text-foreground" />
                </div>
            )}
        </motion.div>
    );
}

interface PipelineFlowProps {
    activeStage?: string;
    onStageClick?: (stageId: string) => void;
}

export default function PipelineFlow({ activeStage, onStageClick }: PipelineFlowProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PIPELINE_STAGES.map((stage, index) => (
                <PipelineStageCard
                    key={stage.id}
                    stage={stage}
                    isActive={activeStage === stage.id}
                    onClick={() => onStageClick?.(stage.id)}
                    delay={index * 0.1}
                    showArrow={index < PIPELINE_STAGES.length - 1 && (index + 1) % 3 !== 0}
                />
            ))}
        </div>
    );
}
