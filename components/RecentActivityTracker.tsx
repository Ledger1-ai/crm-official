"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

const MAX_HISTORY_ITEMS = 5;
const IGNORED_PATHS = ["/crm/dashboard", "/sign-in", "/admin/login"];

export interface HistoryItem {
    href: string;
    label: string;
    timestamp: number;
}

export default function RecentActivityTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const userId = session?.user?.id;

    useEffect(() => {
        if (!pathname || !userId) return;

        // Skip ignored paths
        if (IGNORED_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/"))) {
            return;
        }

        // Also skip if it's just the root crm path without a sub-route (optional, depends on preference)
        if (pathname === "/crm") return;

        const fullPath = searchParams.toString()
            ? `${pathname}?${searchParams.toString()}`
            : pathname;

        // Generate a label (e.g., "/crm/leads/123" -> "Lead 123")
        // This is a naive implementation; ideal would be Context or explicit title setting.
        let label = pathname.split("/").pop() || "Page";

        // Capitalize and clean up
        label = label.charAt(0).toUpperCase() + label.slice(1).replace(/-/g, " ");

        // Check for UUIDs or IDs and try to be smarter
        if (label.match(/^[0-9a-fA-F-]{10,}$/)) {
            // It's probably an ID. Let's try to get the parent path segment for context.
            const parts = pathname.split("/");
            if (parts.length > 2) {
                const parent = parts[parts.length - 2];
                // e.g. "leads" -> "Lead Item", "viewtask" -> "Viewtask Item"
                let parentLabel = parent.charAt(0).toUpperCase() + parent.slice(1);

                if (parentLabel === "Viewtask") {
                    parentLabel = "View Task";
                }

                if (parentLabel.endsWith("s")) {
                    parentLabel = parentLabel.slice(0, -1);
                }
                label = `${parentLabel} Item`;
            } else {
                label = "Item View";
            }
        }

        const newItem: HistoryItem = {
            href: fullPath,
            label: label,
            timestamp: Date.now(),
        };

        try {
            const storageKey = `jump-back-in-history-${userId}`;
            const stored = localStorage.getItem(storageKey);
            let history: HistoryItem[] = stored ? JSON.parse(stored) : [];

            // Remove existing entry for the same path or label to avoid duplicates and bubble to top
            history = history.filter((item) => item.href !== fullPath && item.label !== label);

            // Add new item to the beginning
            history.unshift(newItem);

            // Cap the list
            if (history.length > MAX_HISTORY_ITEMS) {
                history = history.slice(0, MAX_HISTORY_ITEMS);
            }

            localStorage.setItem(storageKey, JSON.stringify(history));
        } catch (e) {
            console.error("Failed to save history", e);
        }
    }, [pathname, searchParams, userId]);

    return null;
}
