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
            className="flex flex-wrap items-center gap-3 pt-4 mt-4 border-t border-border/50"
        >
            <span className="text-xs text-muted-foreground font-medium mr-1">Legend:</span>
            {items.map((item, index) => {
                const isHex = item.color.startsWith("#") || item.color.startsWith("rgb");

                if (isHex) {
                    return (
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
                    );
                }

                // Render as Pill for Tailwind classes
                return (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                        className={cn("px-3 py-1 rounded-full text-xs font-medium border shadow-sm", item.color)}
                    >
                        {item.label}
                    </motion.div>
                );
            })}
        </motion.div>
    );
}

// Pre-defined legends for common diagrams
export const PIPELINE_LEGEND: LegendItem[] = [
    { label: "Lead Sources", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    { label: "Identify", color: "bg-sky-500/20 text-sky-400 border-sky-500/30" },
    { label: "Engage AI", color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" },
    { label: "Engage Human", color: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
    { label: "Offering", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
    { label: "Finalizing", color: "bg-pink-500/20 text-pink-400 border-pink-500/30" },
    { label: "Closed", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
];

export const CONVERSION_LEGEND: LegendItem[] = [
    { label: "Lead", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    { label: "Endpoint", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    { label: "Created Entity", color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" },
    { label: "Complete", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
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
