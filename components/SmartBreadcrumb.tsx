"use client";

import React, { useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

// Dictionary to map path segments to readable labels
const PATH_LABELS: Record<string, string> = {
    dashboard: "Dashboard",
    crm: "CRM",
    leads: "Leads",
    opportunities: "Opportunities",
    contacts: "Contacts",
    accounts: "Accounts",
    companies: "Companies",
    projects: "Projects",
    tasks: "Tasks",
    settings: "Settings",
    admin: "Admin",
    users: "Users",
    roles: "Roles",
    "sales-command": "Command",
    "lead-wizard": "Wizard",
    "lead-pools": "Pools",
    outreach: "Outreach",
    cases: "All Cases",
    contracts: "Contracts",
    products: "Products",
    invoice: "Invoices",
    reports: "Reports",
    employees: "Staff",
    approvals: "Approvals",
    workflows: "Workflows",
    "validation-rules": "Guard Rules",
    university: "University",
    partners: "Platform",
    messages: "Messages",
    forms: "Forms",
    calendar: "Calendar",
    documents: "Documents",
    members: "Members",
    emails: "Emails",
};

export function SmartBreadcrumb({ className }: { className?: string }) {
    const pathname = usePathname();

    const crumbs = useMemo(() => {
        // 1. Clean URL
        const cleanPath = pathname.split("?")[0];
        const segments = cleanPath.split("/").filter(Boolean);

        // 2. Identify and Skip Locale (if present, usually index 0, length 2)
        let startIndex = 0;
        // Simple check: matches [locale] pattern /en, /fr, etc.
        if (segments.length > 0 && /^[a-z]{2}$/i.test(segments[0])) {
            startIndex = 1;
        }

        const relevantSegments = segments.slice(startIndex);

        // If empty or just dashboard, return null (optional: show Home > Dashboard)
        if (relevantSegments.length === 0) return [];
        if (relevantSegments.length === 1 && relevantSegments[0] === "dashboard") return [];

        // 3. Build Crumbs
        let accumulatedPath = startIndex === 1 ? `/${segments[0]}` : "";

        return relevantSegments.map((segment, index) => {
            accumulatedPath += `/${segment}`;

            let label = PATH_LABELS[segment];

            // Fallback formatting
            if (!label) {
                // Check if ID (simple heuristic: alphanumeric > 20 chars)
                if (segment.length > 20 && /[0-9]/.test(segment)) {
                    // Try to make it look like "Details" or similar, maybe truncated ID?
                    // "Details" is safer.
                    label = "Details";
                } else {
                    // Capitalize and spaces
                    label = segment.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                }
            }

            return {
                label,
                href: accumulatedPath,
                isLast: index === relevantSegments.length - 1
            };
        });
    }, [pathname]);

    if (crumbs.length === 0) return null;

    return (
        <nav className={cn("flex px-4 md:px-8 py-3 w-full border-b border-border/40 bg-background/50 backdrop-blur-sm sticky top-0 z-20", className)} aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
                <li>
                    <Link
                        href="/dashboard"
                        className="flex items-center hover:text-foreground hover:bg-muted p-1 rounded-md transition-colors"
                    >
                        <LayoutDashboard className="w-4 h-4" />
                    </Link>
                </li>

                {crumbs.map((crumb) => (
                    <li key={crumb.href} className="flex items-center gap-2">
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40" />

                        {crumb.isLast ? (
                            <span className="font-semibold text-foreground px-2 py-0.5 rounded-md bg-muted/40 text-xs uppercase tracking-wide">
                                {crumb.label}
                            </span>
                        ) : (
                            <Link
                                href={crumb.href}
                                className="hover:text-foreground hover:underline underline-offset-4 transition-colors px-1"
                            >
                                {crumb.label}
                            </Link>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
