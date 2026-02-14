"use client";

import { motion } from "framer-motion";
import { LucideIcon, DollarSign, TrendingUp, Users2, Zap, HardDrive, Target } from "lucide-react";
import { cn } from "@/lib/utils";

// Reduced icon map for validity
const iconMap: Record<string, LucideIcon> = {
    DollarSign,
    TrendingUp,
    Users2,
    Zap,
    HardDrive,
    Target,
};

export type MetricAccent = "cyan" | "violet" | "emerald" | "amber" | "rose";

interface UnifiedMetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    iconName: string;
    accentColor?: MetricAccent;
    delay?: number;
}

const accentColors = {
    cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-500", icon: "text-cyan-400" },
    violet: { bg: "bg-violet-500/10", border: "border-violet-500/20", text: "text-violet-500", icon: "text-violet-400" },
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-500", icon: "text-emerald-400" },
    amber: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-500", icon: "text-amber-400" },
    rose: { bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-500", icon: "text-rose-400" },
};

export function UnifiedMetricCard({
    title,
    value,
    subtitle,
    iconName,
    accentColor = "cyan",
    delay = 0,
}: UnifiedMetricCardProps) {
    const styles = accentColors[accentColor];
    const Icon = iconMap[iconName] || DollarSign;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className={cn(
                "relative overflow-hidden rounded-xl border p-4 transition-all hover:shadow-md",
                styles.bg,
                styles.border
            )}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
                    </div>
                    {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
                </div>
                <div className={cn("rounded-lg p-2 bg-background/50", styles.icon)}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </motion.div>
    );
}
