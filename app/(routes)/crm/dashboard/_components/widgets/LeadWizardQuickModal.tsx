"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Bot,
    Wand2,
    Zap,
    Sparkles,
    Loader2,
    FolderKanban,
    Target,
    ChevronDown,
    Rocket,
} from "lucide-react";
import { toast } from "react-hot-toast";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import Link from "next/link";

interface LeadWizardQuickModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onJobStarted?: () => void;
}

export const LeadWizardQuickModal = ({
    open,
    onOpenChange,
    onJobStarted,
}: LeadWizardQuickModalProps) => {
    const [poolName, setPoolName] = useState("");
    const [aiPrompt, setAiPrompt] = useState("");
    const [maxCompanies, setMaxCompanies] = useState(50);
    const [campaignId, setCampaignId] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Fetch projects for the optional selector
    const { data: campaignsData } = useSWR<{
        projects: { id: string; title: string }[];
    }>(open ? "/api/campaigns" : null, fetcher);

    const resetForm = () => {
        setPoolName("");
        setAiPrompt("");
        setMaxCompanies(50);
        setCampaignId("");
        setShowAdvanced(false);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!poolName.trim()) {
            toast.error("Please name your discovery pool");
            return;
        }
        if (!aiPrompt.trim()) {
            toast.error("Describe your ideal customer profile");
            return;
        }

        setSubmitting(true);

        try {
            // Step 1: Try to parse the AI prompt into structured ICP
            let icpData: any = {};
            try {
                const parseRes = await fetch("/api/leads/parse-icp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: aiPrompt }),
                });
                if (parseRes.ok) {
                    icpData = await parseRes.json();
                }
            } catch {
                // If parsing fails, fall through with raw prompt as notes
            }

            // Step 2: Build payload
            const payload = {
                name: poolName,
                icp: {
                    industries: icpData.industries || [],
                    companySizes: icpData.companySizes || [],
                    geos: icpData.geos || [],
                    techStack: icpData.techStack || [],
                    titles: icpData.titles || [],
                    excludeDomains: [],
                    notes: icpData.notes || aiPrompt,
                },
                providers: {
                    agenticAI: true,
                    serp: true,
                    serpFallback: true,
                },
                limits: {
                    maxCompanies,
                    maxContactsPerCompany: 3,
                },
                projectId: campaignId || undefined,
            };

            // Step 3: Create the job
            const res = await fetch("/api/leads/autogen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();

            // Step 4: Auto-trigger pipeline
            try {
                await fetch(`/api/leads/autogen/run/${data.jobId}`, {
                    method: "POST",
                });
            } catch (err) {
                console.error("Failed to trigger pipeline:", err);
            }

            toast.success("AI Discovery Agent launched! 🚀");
            resetForm();
            onOpenChange(false);
            onJobStarted?.();
        } catch (err: any) {
            toast.error(err.message || "Failed to start discovery job");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-black/90 border-white/10 backdrop-blur-2xl shadow-2xl shadow-cyan-500/5 p-0 gap-0 overflow-hidden">
                {/* Decorative Top Gradient Bar */}
                <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />

                {/* Header */}
                <DialogHeader className="px-6 pt-5 pb-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
                            <Wand2 size={20} className="text-cyan-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                                Quick Discovery Session
                                <Sparkles
                                    size={14}
                                    className="text-cyan-400 animate-pulse"
                                />
                            </DialogTitle>
                            <DialogDescription className="text-xs text-white/40 mt-0.5">
                                Launch an AI-powered lead discovery agent
                                without leaving your dashboard.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={onSubmit} className="px-6 pt-4 pb-6 space-y-4">
                    {/* Pool Name */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-cyan-400/80 flex items-center gap-1.5">
                            <Target size={10} />
                            Pool Name
                        </label>
                        <input
                            id="quickwizard-pool-name"
                            value={poolName}
                            onChange={(e) => setPoolName(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white placeholder:text-white/25 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 focus:bg-white/[0.07] transition-all outline-none"
                            placeholder="e.g. Q1 SaaS Outreach, Fintech EU Pipeline..."
                            autoFocus
                        />
                    </div>

                    {/* AI Prompt — The Star of the Show */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-cyan-400/80 flex items-center gap-1.5">
                            <Bot size={10} />
                            Describe Your Ideal Customer
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                            <textarea
                                id="quickwizard-ai-prompt"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                rows={4}
                                className="relative w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 focus:bg-white/[0.07] transition-all resize-none outline-none"
                                placeholder="e.g. B2B SaaS companies in the US with 50-200 employees. They should be in Fintech or Healthcare, using HubSpot and Stripe. Target VP of Sales and CTO roles..."
                            />
                            <div className="absolute bottom-2 right-2 flex gap-1.5">
                                <button
                                    type="button"
                                    className="text-[10px] flex items-center gap-1 px-2 py-1 rounded-md border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                                    onClick={() =>
                                        toast.success(
                                            "AI enhancement coming soon!"
                                        )
                                    }
                                >
                                    <Zap size={9} /> Enhance
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Advanced Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="w-full flex items-center justify-center gap-2 py-2 text-[11px] text-white/30 hover:text-white/60 transition-colors group"
                    >
                        <div className="h-px flex-1 bg-white/5 group-hover:bg-white/10 transition-colors" />
                        <span className="flex items-center gap-1 font-medium uppercase tracking-wider">
                            Advanced Options
                            <ChevronDown
                                size={12}
                                className={`transition-transform duration-200 ${showAdvanced ? "rotate-180" : ""}`}
                            />
                        </span>
                        <div className="h-px flex-1 bg-white/5 group-hover:bg-white/10 transition-colors" />
                    </button>

                    {/* Advanced Options Panel */}
                    <div
                        className={`grid transition-all duration-300 ease-in-out ${showAdvanced ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                    >
                        <div className="overflow-hidden">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 pb-2">
                                {/* Project Selector */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase tracking-wider font-bold text-white/40 flex items-center gap-1.5">
                                        <FolderKanban size={10} />
                                        Link to Project
                                    </label>
                                    <select
                                        id="quickwizard-project"
                                        value={campaignId}
                                        onChange={(e) =>
                                            setCampaignId(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="">
                                            — No Project —
                                        </option>
                                        {(campaignsData?.projects || []).map(
                                            (p) => (
                                                <option
                                                    key={p.id}
                                                    value={p.id}
                                                >
                                                    {p.title}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                {/* Max Companies */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase tracking-wider font-bold text-white/40 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <Target size={10} />
                                            Max Companies
                                        </span>
                                        <span className="text-cyan-400 font-mono text-xs tabular-nums">
                                            {maxCompanies}
                                        </span>
                                    </label>
                                    <input
                                        id="quickwizard-max-companies"
                                        type="range"
                                        min={10}
                                        max={100}
                                        step={10}
                                        value={maxCompanies}
                                        onChange={(e) =>
                                            setMaxCompanies(
                                                Number(e.target.value)
                                            )
                                        }
                                        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 accent-cyan-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-cyan-500/30 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-cyan-300"
                                    />
                                    <div className="flex justify-between text-[9px] text-white/20 font-mono">
                                        <span>10</span>
                                        <span>50</span>
                                        <span>100</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                        id="quickwizard-launch-btn"
                        type="submit"
                        disabled={
                            submitting ||
                            !poolName.trim() ||
                            !aiPrompt.trim()
                        }
                        className="w-full h-12 relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 bg-[length:200%_auto] hover:bg-right text-white font-bold text-sm shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all duration-500 disabled:opacity-40 disabled:shadow-none border-0 group"
                    >
                        <span className="relative flex items-center justify-center gap-2.5">
                            {submitting ? (
                                <>
                                    <Loader2
                                        size={18}
                                        className="animate-spin"
                                    />
                                    Deploying Discovery Agent...
                                </>
                            ) : (
                                <>
                                    <Rocket
                                        size={18}
                                        className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                                    />
                                    Launch AI Discovery
                                </>
                            )}
                        </span>
                        {/* Shimmer effect */}
                        {!submitting && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        )}
                    </Button>

                    {/* Hint */}
                    <p className="text-[10px] text-center text-white/20">
                        Need more control?{" "}
                        <Link
                            href="/crm/lead-wizard"
                            className="text-cyan-500/60 hover:text-cyan-400 underline underline-offset-2 transition-colors"
                        >
                            Open the full wizard
                        </Link>{" "}
                        for guided and advanced modes.
                    </p>
                </form>
            </DialogContent>
        </Dialog>
    );
};
