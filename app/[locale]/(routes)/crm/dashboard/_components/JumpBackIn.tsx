"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { HistoryItem } from "@/components/RecentActivityTracker";
import { cn } from "@/lib/utils";

// Helper to get color based on label (matching Dashboard colors)
function getBreadcrumbColor(label: string) {
    const l = label.toLowerCase();
    if (l.includes('lead pool')) return "blue";
    if (l.includes('lead wizard')) return "cyan";
    if (l.includes('lead')) return "emerald";
    if (l.includes('campaign')) return "orange";
    if (l.includes('account')) return "cyan";
    if (l.includes('contact')) return "violet";
    if (l.includes('deal') || l.includes('opportunity')) return "amber";
    if (l.includes('dialer')) return "indigo";
    return "emerald"; // Default fallback
}

interface JumpBackInProps {
    align?: "left" | "right";
    className?: string;
    userId: string;
}

export default function JumpBackIn({ align = "left", className, userId }: JumpBackInProps) {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (!userId) return; // Wait for user ID

        try {
            const storageKey = `jump-back-in-history-${userId}`;
            const stored = localStorage.getItem(storageKey);

            if (stored) {
                let parsed = JSON.parse(stored);
                // Fix legacy typo "Viewtas Item" -> "Task View"
                let hasChanges = false;
                parsed = parsed.map((item: HistoryItem) => {
                    if (item.label === "Viewtas Item") {
                        hasChanges = true;
                        return { ...item, label: "Task View" };
                    }
                    return item;
                });

                setHistory(parsed);

                if (hasChanges) {
                    localStorage.setItem(storageKey, JSON.stringify(parsed));
                }
            } else {
                setHistory([]);
            }
        } catch (e) {
            console.error("Failed to load history", e);
        }
    }, [userId]);

    if (!isMounted) return null;

    // Filter out "Dashboard" as requested (redundant)
    const filteredHistory = history.filter(item =>
        !item.label.toLowerCase().includes('dashboard') &&
        !item.href.includes('/crm/sales-command') &&
        !item.href.endsWith('/crm/dashboard')
    ).slice(0, 5); // Limit to 5 max

    if (filteredHistory.length === 0) return null;

    const alignmentClass = align === "right" ? "justify-end" : "justify-start";
    const textAlignClass = align === "right" ? "text-right" : "text-left";

    return (
        <div className={cn("animate-in fade-in slide-in-from-top-2 duration-500 mb-0", className)}>
            {/* "Sexy" Breadcrumb Header - Compact */}
            <div className={cn("flex items-center gap-1.5 mb-1.5 px-1", alignmentClass)}>
                <Clock className="w-3 h-3 text-white/40" />
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40">Jump Back In</h3>
            </div>

            <div className={cn("flex flex-wrap items-center gap-2", alignmentClass)}>
                {filteredHistory.map((item, index) => {
                    const color = getBreadcrumbColor(item.label);

                    // Tailwind dynamic classes based on color
                    let colorClasses = "bg-emerald-500/10 text-emerald-100 border-emerald-500/20 group-hover:border-emerald-500/50 group-hover:bg-emerald-500/20";
                    if (color === 'blue') colorClasses = "bg-blue-500/10 text-blue-100 border-blue-500/20 group-hover:border-blue-500/50 group-hover:bg-blue-500/20";
                    if (color === 'cyan') colorClasses = "bg-cyan-500/10 text-cyan-100 border-cyan-500/20 group-hover:border-cyan-500/50 group-hover:bg-cyan-500/20";
                    if (color === 'orange') colorClasses = "bg-orange-500/10 text-orange-100 border-orange-500/20 group-hover:border-orange-500/50 group-hover:bg-orange-500/20";
                    if (color === 'violet') colorClasses = "bg-violet-500/10 text-violet-100 border-violet-500/20 group-hover:border-violet-500/50 group-hover:bg-violet-500/20";
                    if (color === 'amber') colorClasses = "bg-amber-500/10 text-amber-100 border-amber-500/20 group-hover:border-amber-500/50 group-hover:bg-amber-500/20";
                    if (color === 'indigo') colorClasses = "bg-indigo-500/10 text-indigo-100 border-indigo-500/20 group-hover:border-indigo-500/50 group-hover:bg-indigo-500/20";

                    return (
                        <React.Fragment key={`${item.href}-${index}`}>
                            {index > 0 && (
                                <span className="text-white/10 rotate-12 select-none">/</span>
                            )}
                            <Link
                                href={item.href}
                                className={cn(
                                    "group flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all border",
                                    colorClasses
                                )}
                            >
                                <span className="capitalize tracking-wide">{item.label}</span>
                            </Link>
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}
