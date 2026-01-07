"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LegendItem {
    label: string;
    color: string;
}

interface FlowDiagramCardProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
    accentColor?: "blue" | "emerald" | "violet" | "amber" | "rose";
    legend?: LegendItem[];
}

const accentStyles = {
    blue: "from-blue-500/10 to-transparent border-blue-500/20",
    emerald: "from-emerald-500/10 to-transparent border-emerald-500/20",
    violet: "from-violet-500/10 to-transparent border-violet-500/20",
    amber: "from-amber-500/10 to-transparent border-amber-500/20",
    rose: "from-rose-500/10 to-transparent border-rose-500/20",
};

// Legend component for Mermaid diagrams
function DiagramLegend({ items }: { items: LegendItem[] }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-3 pt-4 mt-4 border-t border-border/50"
        >
            <span className="text-xs text-muted-foreground font-medium">Legend:</span>
            {items.map((item, index) => (
                <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className="flex items-center gap-1.5"
                >
                    <span
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                </motion.div>
            ))}
        </motion.div>
    );
}

// Pre-defined legends for common diagrams
export const PIPELINE_LEGEND: LegendItem[] = [
    { label: "Lead Sources", color: "#dbeafe" },
    { label: "Identify", color: "#e0f2fe" },
    { label: "Engage AI", color: "#dbeafe" },
    { label: "Engage Human", color: "#c7d2fe" },
    { label: "Offering", color: "#e9d5ff" },
    { label: "Finalizing", color: "#fce7f3" },
    { label: "Closed", color: "#dcfce7" },
];

export const CONVERSION_LEGEND: LegendItem[] = [
    { label: "Lead", color: "#fef3c7" },
    { label: "Endpoint", color: "#dbeafe" },
    { label: "Created Entity", color: "#c7d2fe" },
    { label: "Complete", color: "#dcfce7" },
];

export default function FlowDiagramCard({
    title,
    description,
    children,
    className,
    accentColor = "blue",
    legend,
}: FlowDiagramCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <Card className={cn(
                "overflow-hidden border backdrop-blur-sm",
                "bg-gradient-to-br",
                accentStyles[accentColor],
                className
            )}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{title}</CardTitle>
                    {description && (
                        <CardDescription>{description}</CardDescription>
                    )}
                </CardHeader>
                <CardContent>
                    {children}
                    {legend && legend.length > 0 && (
                        <DiagramLegend items={legend} />
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
