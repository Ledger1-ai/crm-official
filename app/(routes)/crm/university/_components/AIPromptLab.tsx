"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Bot,
    MessageCircle,
    Sparkles,
    Settings2,
    Play,
    Copy,
    Check,
    Cpu,
    Zap,
    Mic2
} from "lucide-react";
import { cn } from "@/lib/utils";

const PERSONAS = [
    {
        name: "The Consultative Partner",
        role: "Strategic Advisor",
        description: "Focuses on deep discovery and long-term value. Best for high-ticket Enterprise deals.",
        tone: "Professional, Empathetic, Authority-driven",
        samplePrompt: "You are a senior strategic advisor. Your goal is to uncover the underlying business challenges and demonstrate how our platform acts as a catalyst for growth. Do not rush the close; focus on building extreme trust.",
        tags: ["High Ticket", "Enterprise", "B2B"]
    },
    {
        name: "The High-Energy Closer",
        role: "Sales Specialist",
        description: "Fast-paced and focused on immediate action. Best for transactional sales and limited-time offers.",
        tone: "Enthusiastic, Urgent, Benefits-focused",
        samplePrompt: "You are a high-energy sales specialist. Your goal is to highlight the immediate ROI and create a sense of healthy urgency. Focus on 'Quick Wins' and ease of implementation.",
        tags: ["Transactional", "SaaS", "Fast Paced"]
    },
    {
        name: "The Technical Expert",
        role: "Solutions Engineer",
        description: "Deep technical knowledge. Best for developer-facing products or complex implementations.",
        tone: "Precise, Fact-based, Logical",
        samplePrompt: "You are a principal solutions engineer. You lead with data and technical specifications. Avoid fluff; provide clear, verifiable answers to technical hurdles.",
        tags: ["Technical", "DevOps", "Precise"]
    }
];

export default function AIPromptLab() {
    const [copied, setCopied] = useState<string | null>(null);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="space-y-8 pb-32">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Cpu className="w-6 h-6 text-emerald-400" />
                        AI Prompt Lab & Persona Playbook
                    </h2>
                    <p className="text-gray-400 text-sm">Design, test, and deploy high-converting AI personalities.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-500/5 border-emerald-500/20 text-emerald-400">GPT-4o Optimized</Badge>
                    <Badge variant="outline" className="bg-blue-500/5 border-blue-500/20 text-blue-400">Claude 3.5 Ready</Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Persona Playbook */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Bot className="w-5 h-5 text-blue-400" />
                        Winning Persona Library
                    </h3>
                    <div className="space-y-4">
                        {PERSONAS.map((persona) => (
                            <motion.div
                                key={persona.name}
                                whileHover={{ scale: 1.01 }}
                                className="group p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-lg group-hover:text-blue-400 transition-colors uppercase tracking-tight">{persona.name}</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {persona.tags.map(tag => (
                                                    <Badge key={tag} variant="secondary" className="text-[9px] py-0 h-4">{tag}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-400 leading-relaxed italic">
                                        {persona.description}
                                    </p>

                                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Base Instruction</span>
                                            <button
                                                onClick={() => handleCopy(persona.samplePrompt, persona.name)}
                                                className="text-muted-foreground hover:text-white transition-colors"
                                            >
                                                {copied === persona.name ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                                            {persona.samplePrompt}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Sandbox Mockup */}
                <div className="space-y-6 h-fit">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                        Instruction Playground
                    </h3>

                    <Card className="bg-black/40 border-white/10 flex flex-col overflow-hidden">
                        <CardHeader className="bg-white/5 border-b border-white/10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                                        <Settings2 className="w-4 h-4" />
                                    </div>
                                    <CardTitle className="text-sm">Sandbox Mode</CardTitle>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-widest">Active</span>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1 p-6 space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-muted-foreground uppercase">System Prompt (Instructions)</label>
                                <div className="w-full min-h-[150px] p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 font-mono leading-relaxed outline-none focus:border-emerald-500/50 transition-colors">
                                    You are an AI sales expert specialized in SaaS. Lead with curiosity...
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Temperature</label>
                                    <div className="h-1 w-full bg-white/10 rounded-full relative">
                                        <div className="absolute top-1/2 left-3/4 -translate-y-1/2 w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                                        <span>Concise</span>
                                        <span>Creative</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Output Length</label>
                                    <div className="h-1 w-full bg-white/10 rounded-full relative">
                                        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                                        <span>Short</span>
                                        <span>Long</span>
                                    </div>
                                </div>
                            </div>

                            <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
                                <Play className="w-4 h-4 fill-white" />
                                Test Instruction Set
                            </button>
                        </CardContent>

                        <div className="bg-white/5 border-t border-white/10 p-6 space-y-4">
                            <div className="flex items-center gap-2">
                                <MessageCircle className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs font-bold text-muted-foreground">PREVIEW OUTPUT</span>
                            </div>
                            <div className="p-4 rounded-xl bg-black/20 border border-white/5 text-xs text-gray-400 italic font-medium">
                                \"Hello there! I noticed you were exploring our lead generation tools. I'm curious – what's the biggest bottleneck in your current pipeline?\"
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* AI Capability Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-12">
                {[
                    { label: "Voice Optimized", icon: Mic2, color: "blue" },
                    { label: "High Token Limit", icon: Zap, color: "amber" },
                    { label: "JSON Structure", icon: Cpu, color: "emerald" },
                    { label: "Multi-modal Ready", icon: Bot, color: "violet" },
                ].map((cap, i) => (
                    <Card key={i} className="bg-white/5 border-white/10 p-4">
                        <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg bg-white/5", `text-${cap.color}-400`)}>
                                <cap.icon className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest">{cap.label}</span>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
