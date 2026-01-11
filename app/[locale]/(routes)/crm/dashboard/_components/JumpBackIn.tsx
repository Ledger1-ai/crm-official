"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight, Clock } from "lucide-react";
import { HistoryItem } from "@/components/RecentActivityTracker";



export default function JumpBackIn() {
    const { data: session } = useSession(); // Add session hook
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isMounted, setIsMounted] = useState(false);

    // Get userId safely
    const userId = session?.user?.id;

    useEffect(() => {
        setIsMounted(true);
        if (!userId) return; // Wait for user ID

        try {
            const storageKey = `jump-back-in-history-${userId}`;
            const stored = localStorage.getItem(storageKey);

            // Migration: Check for legacy key and migrate if empty (optional, but good UX)
            // If new key is empty, strictly we should start fresh or copy? 
            // The requirement says "Only pages that THEY have visited". 
            // So we should probably NOT migrate the shared history to avoid polluting it.
            // We'll just start fresh for the namespaced key.

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
                // Initialize empty to ensure no cross-contamination
                setHistory([]);
            }
        } catch (e) {
            console.error("Failed to load history", e);
        }
    }, [userId]); // Re-run when userId is available

    if (!isMounted) return null;

    // Fallback if no history yet
    if (history.length === 0) {
        return (
            <div className="mb-8 opacity-50">
                <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <h3 className="text-sm font-medium uppercase tracking-wider">Jump Back In</h3>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground italic">Your recent activity will appear here.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <h3 className="text-sm font-medium uppercase tracking-wider">Jump Back In</h3>
            </div>

            <div className="flex items-start md:items-center justify-between gap-4">
                <div className="flex flex-wrap gap-4">
                    {history.map((item, index) => (
                        <Link
                            key={`${item.href}-${index}`}
                            href={item.href}
                            className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card hover:bg-accent/50 hover:border-primary/50 transition-all text-sm font-medium capitalize"
                        >
                            {item.label}
                            <ArrowRight className="w-3 h-3 opacity-50" />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
