"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    Mail,
    ArrowRight,
    User,
    Users,
    Building2,
    Sparkles,
    CheckCircle2,
    PartyPopper,
    MessageCircle,
    TrendingUp,
} from "lucide-react";

interface ConversionStep {
    id: string;
    label: string;
    subtitle: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
}

const leadToContactSteps: ConversionStep[] = [
    { id: "lead", label: "Qualified Lead", subtitle: "Ready for next step", icon: User, color: "text-amber-500", bgColor: "bg-amber-500/10" },
    { id: "convert", label: "Click Convert", subtitle: "Manual Action", icon: ArrowRight, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { id: "opp_contact", label: "Opp & Contact", subtitle: "Created Instantly", icon: Users, color: "text-indigo-500", bgColor: "bg-indigo-500/10" },
    { id: "engage", label: "Work Deal", subtitle: "Manage Pipeline", icon: TrendingUp, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
];

const leadToAccountSteps: ConversionStep[] = [
    { id: "opp", label: "Opportunity", subtitle: "In Pipeline", icon: TrendingUp, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { id: "close", label: "Close Won", subtitle: "Mark as Won", icon: CheckCircle2, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    { id: "account", label: "Account Created", subtitle: "New Customer", icon: Building2, color: "text-purple-500", bgColor: "bg-purple-500/10" },
    { id: "growth", label: "Growth", subtitle: "Upsell & Retain", icon: Sparkles, color: "text-amber-500", bgColor: "bg-amber-500/10" },
];

interface FlowRowProps {
    title: string;
    description: string;
    steps: ConversionStep[];
    delay?: number;
    accentColor: string;
    celebration?: boolean;
}

function FlowRow({ title, description, steps, delay = 0, accentColor, celebration }: FlowRowProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className={cn(
                "p-4 rounded-xl border bg-gradient-to-br from-card to-muted/20 backdrop-blur-sm",
                `border-${accentColor}-500/20`
            )}
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
                <Sparkles className={cn("w-4 h-4", `text-${accentColor}-500`)} />
                <h3 className="font-semibold text-sm">{title}</h3>
                {celebration && <PartyPopper className="w-4 h-4 text-amber-500" />}
            </div>
            <p className="text-sm text-muted-foreground mb-3">{description}</p>

            {/* Flow Steps - Compact */}
            <div className="flex items-center justify-between gap-1 py-2 overflow-x-auto">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                        <React.Fragment key={step.id}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: delay + 0.1 + index * 0.1 }}
                                className="flex flex-col items-center gap-1 min-w-0 flex-1"
                            >
                                <div className={cn(
                                    "w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center border shadow-sm",
                                    step.bgColor, "border-border/50"
                                )}>
                                    <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", step.color)} />
                                </div>
                                <div className="text-center">
                                    <span className="text-[10px] sm:text-xs font-semibold block truncate max-w-[70px] sm:max-w-none">{step.label}</span>
                                    <span className="text-[9px] sm:text-xs text-muted-foreground truncate block max-w-[70px] sm:max-w-none">{step.subtitle}</span>
                                </div>
                            </motion.div>

                            {index < steps.length - 1 && (
                                <ArrowRight className="w-4 h-4 text-muted-foreground/50 shrink-0 mt-[-16px]" />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </motion.div>
    );
}

export default function AutoConversionFlow() {
    return (
        <div className="space-y-3">
            <FlowRow
                title="When You Convert a Lead"
                description="Converting a lead creates both a Contact and an Opportunity in your pipeline."
                steps={leadToContactSteps}
                delay={0}
                accentColor="blue"
            />
            <FlowRow
                title="When You Close an Opportunity"
                description="Closing a deal automatically creates a Customer Account record."
                steps={leadToAccountSteps}
                delay={0.15}
                accentColor="emerald"
                celebration
            />
        </div>
    );
}
