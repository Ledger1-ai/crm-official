"use client";

import React, { useState } from "react";
import { WidgetWrapper } from "./WidgetWrapper";
import {
    Wand2,
    Zap,
    Play,
    CheckCircle2,
    Rocket,
    Activity,
    Globe,
    Building2,
    ExternalLink,
    Power,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { LeadWizardQuickModal } from "./LeadWizardQuickModal";
import Link from "next/link";

interface LeadWizardWidgetProps {
    data: {
        activeJobs: any[];
        recentSuccessCount: number;
    } | null;
}

/**
 * Extracts a human-readable summary from a job's ICP config.
 * e.g. "SaaS, Fintech in US, UK" or "Healthcare companies"
 */
function getAgentSummary(job: any): string {
    const pool = job.assigned_pool;
    if (!pool?.icpConfig) return "Discovering leads...";

    const icp =
        typeof pool.icpConfig === "string"
            ? JSON.parse(pool.icpConfig)
            : pool.icpConfig;

    const parts: string[] = [];

    // Industries
    const industries = icp.industries || [];
    if (industries.length > 0) {
        parts.push(industries.slice(0, 2).join(", "));
    }

    // Geos
    const geos = icp.geos || [];
    if (geos.length > 0) {
        const geoStr = geos.slice(0, 2).join(", ");
        parts.push(`in ${geoStr}`);
    }

    // Titles
    const titles = icp.titles || [];
    if (parts.length === 0 && titles.length > 0) {
        parts.push(`targeting ${titles.slice(0, 2).join(", ")}`);
    }

    if (parts.length === 0) return "Discovering leads...";

    return `Scanning ${parts.join(" ")}`;
}

/**
 * Gets counter stats from a job for display
 */
function getJobCounters(job: any): {
    companies: number;
    contacts: number;
} {
    const counters =
        typeof job.counters === "string"
            ? JSON.parse(job.counters)
            : job.counters;
    return {
        companies: counters?.companiesFound || 0,
        contacts: counters?.contactsCreated || 0,
    };
}

export const LeadWizardWidget = ({ data }: LeadWizardWidgetProps) => {
    const [quickModalOpen, setQuickModalOpen] = useState(false);

    const isAgentActive = !!(data?.activeJobs && data.activeJobs.length > 0);

    return (
        <div className="h-full relative">
            <WidgetWrapper
                title="Lead Wizard"
                icon={Wand2}
                iconColor="text-cyan-400"
                footerHref="/crm/lead-wizard"
                footerLabel="Open Wizard"
                rightAction={
                    <button
                        onClick={() => setQuickModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-105 transition-all duration-300"
                    >
                        <Rocket size={11} />
                        Quick Launch
                    </button>
                }
            >
                <div className="space-y-4 pt-2">
                    {/* Hero Section — Clickable to open modal */}
                    <div
                        onClick={() => setQuickModalOpen(true)}
                        className="bg-gradient-to-br from-cyan-500/20 to-blue-500/10 rounded-xl p-4 border border-cyan-500/20 group cursor-pointer hover:border-cyan-500/40 hover:from-cyan-500/25 hover:to-blue-500/15 transition-all duration-300"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setQuickModalOpen(true);
                            }
                        }}
                    >
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <h3 className="text-[13px] font-bold text-white flex items-center gap-2">
                                    New Discovery Session
                                    <Zap
                                        size={12}
                                        className="text-cyan-400 animate-pulse"
                                    />
                                </h3>
                                <p className="text-[11px] text-cyan-100/60 leading-relaxed max-w-[180px]">
                                    Find high-intent leads using AI-driven
                                    industry &amp; geo targeting.
                                </p>
                            </div>
                            <div className="p-2 bg-cyan-500 text-white rounded-lg shadow-lg shadow-cyan-500/20 group-hover:scale-110 group-hover:shadow-cyan-500/40 transition-all duration-300">
                                <Play size={14} fill="currentColor" />
                            </div>
                        </div>
                    </div>

                    {/* Agent Status Section */}
                    <div className="space-y-3">
                        {/* Status Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div
                                    className={`relative flex items-center justify-center w-5 h-5 rounded-full ${isAgentActive ? "bg-emerald-500/20" : "bg-white/5"}`}
                                >
                                    <div
                                        className={`w-2 h-2 rounded-full ${isAgentActive ? "bg-emerald-400" : "bg-white/20"}`}
                                    />
                                    {isAgentActive && (
                                        <div className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
                                    )}
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Agent Status
                                </span>
                            </div>
                            <span
                                className={`text-[10px] font-bold uppercase tracking-wider ${isAgentActive ? "text-emerald-400" : "text-white/25"}`}
                            >
                                {isAgentActive ? (
                                    <span className="flex items-center gap-1">
                                        <Activity size={10} />
                                        Active
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1">
                                        <Power size={10} />
                                        Offline
                                    </span>
                                )}
                            </span>
                        </div>

                        {/* Active Jobs */}
                        {isAgentActive ? (
                            <div className="space-y-2">
                                {data!.activeJobs.map((job) => {
                                    const summary = getAgentSummary(job);
                                    const counters = getJobCounters(job);
                                    const poolId = job.assigned_pool?.id;

                                    return (
                                        <Link
                                            key={job.id}
                                            href={
                                                poolId
                                                    ? `/crm/lead-pools/${poolId}`
                                                    : "/crm/lead-pools"
                                            }
                                            className="block group/job"
                                        >
                                            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 border border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300 cursor-pointer">
                                                {/* What the agent is doing */}
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 shrink-0">
                                                            <Globe
                                                                size={12}
                                                                className="animate-[spin_8s_linear_infinite]"
                                                            />
                                                        </div>
                                                        <p className="text-[11px] font-medium text-white/80 truncate">
                                                            {summary}
                                                        </p>
                                                    </div>
                                                    <ExternalLink
                                                        size={10}
                                                        className="text-white/20 group-hover/job:text-cyan-400 transition-colors shrink-0 mt-0.5"
                                                    />
                                                </div>

                                                {/* Progress bar */}
                                                <Progress
                                                    value={45}
                                                    className="h-1 bg-white/5 mb-2"
                                                    indicatorClassName="bg-gradient-to-r from-emerald-500 to-cyan-500"
                                                />

                                                {/* Counters */}
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center gap-1 text-[9px] text-emerald-400/70 font-medium">
                                                        <Building2 size={9} />
                                                        {counters.companies}{" "}
                                                        companies
                                                    </span>
                                                    <span className="flex items-center gap-1 text-[9px] text-cyan-400/70 font-medium">
                                                        <Wand2 size={9} />
                                                        {counters.contacts}{" "}
                                                        contacts
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            /* Offline state */
                            <div className="p-3 rounded-xl border border-dashed border-white/5 bg-white/[0.02] text-center">
                                <p className="text-[11px] text-white/25 font-medium">
                                    No agents running
                                </p>
                                <p className="text-[10px] text-white/15 mt-0.5">
                                    Start a discovery session to activate the AI
                                    agent.
                                </p>
                            </div>
                        )}

                        {/* Recent successes */}
                        {data?.recentSuccessCount ? (
                            <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
                                <CheckCircle2 size={12} />
                                <span>
                                    {data.recentSuccessCount} successful{" "}
                                    {data.recentSuccessCount === 1
                                        ? "job"
                                        : "jobs"}{" "}
                                    in last 24h
                                </span>
                            </div>
                        ) : null}
                    </div>
                </div>
            </WidgetWrapper>

            {/* Quick-Launch Modal */}
            <LeadWizardQuickModal
                open={quickModalOpen}
                onOpenChange={setQuickModalOpen}
            />
        </div>
    );
};
