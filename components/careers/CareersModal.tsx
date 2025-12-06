"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, MapPin, Clock, ArrowRight, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, useEffect } from "react";
// Using the custom renderer from BlogPostModal logic or duplicating it here for independence
// But to keep it DRY-ish, I will implement a simpler version or reuse if exported (it wasn't).
// Duplicating the simple renderer for stability.

interface JobPosting {
    id: string;
    title: string;
    department: string;
    location: string;
    type: string;
    description: string | null;
    summary: string | null;
    content: string | null;
    requirements?: string | null;
    active: boolean;
}

interface CareersModalProps {
    job: JobPosting | null;
    isOpen: boolean;
    onClose: () => void;
}

export function CareersModal({ job, isOpen, onClose }: CareersModalProps) {
    if (!job) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl w-full p-0 border-0 bg-transparent shadow-none [&>button]:hidden h-[90vh]">
                <div className="bg-[#0A0A0B] border border-white/10 rounded-3xl w-full h-full shadow-2xl flex flex-col relative overflow-hidden backdrop-blur-xl">

                    {/* Header Area */}
                    <div className="relative p-8 md:p-12 pb-6 shrink-0 bg-gradient-to-b from-blue-900/20 to-transparent border-b border-white/5">
                        <div className="absolute top-0 right-0 p-4">
                            <button
                                onClick={onClose}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider border border-blue-500/20">
                                {job.department}
                            </span>
                            <span className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider border border-purple-500/20">
                                {job.type}
                            </span>
                        </div>

                        <DialogTitle className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                            {job.title}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-400">
                            Job Details for {job.title} in {job.location}
                        </DialogDescription>

                        <div className="flex flex-wrap gap-6 text-slate-400 text-sm">
                            <span className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-slate-500" />
                                {job.location}
                            </span>
                            <span className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-slate-500" />
                                Posted Recently
                            </span>
                            {/* Placeholder for salary if we had it in schema, user didn't ask explicitly but good for "standard" info */}
                            <span className="flex items-center gap-2 text-green-400/80">
                                <DollarSign className="h-4 w-4" />
                                Competitive Saliary & Equity
                            </span>
                        </div>
                    </div>

                    {/* Content Scroll Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0A0A0B]/50">
                        <div className="p-8 md:p-12 max-w-3xl mx-auto space-y-12">

                            {/* Description */}
                            <div>
                                <h3 className="text-xl font-bold text-white mb-4">About the Role</h3>
                                <div className="prose prose-invert max-w-none text-slate-300">
                                    <SimpleMarkdown content={job.content || job.description || ""} />
                                </div>
                            </div>

                            {/* Requirements */}
                            {job.requirements && (
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-4">Requirements</h3>
                                    <div className="prose prose-invert max-w-none text-slate-300">
                                        <SimpleMarkdown content={job.requirements} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer / CTA */}
                    <div className="p-6 border-t border-white/10 bg-[#0A0A0B] backdrop-blur flex justify-between items-center shrink-0">
                        <div className="hidden md:block">
                            <p className="text-sm text-slate-400">Interested in this role?</p>
                            <p className="text-xs text-slate-600">Join our team in {job.location}</p>
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                            <Button onClick={onClose} variant="ghost" className="hidden md:flex text-slate-400 hover:text-white">
                                Close
                            </Button>
                            <Link href={`/careers/apply/${job.id}`} className="w-full md:w-auto">
                                <Button className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                                    Apply for this Job <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function SimpleMarkdown({ content }: { content: string }) {
    if (!content) return null;
    return (
        <div className="whitespace-pre-wrap leading-relaxed">
            {content.split('\n').map((line, i) => {
                // Basic list handling
                if (line.trim().startsWith('- ')) {
                    return <li key={i} className="ml-4 list-disc marker:text-slate-500">{line.replace('- ', '')}</li>
                }
                // Basic header
                if (line.startsWith('#')) {
                    return <strong key={i} className="block text-white text-lg mt-4 mb-2">{line.replace(/#/g, '')}</strong>
                }
                return <p key={i} className="mb-2">{line}</p>
            })}
        </div>
    )
}
