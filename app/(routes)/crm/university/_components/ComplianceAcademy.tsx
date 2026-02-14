"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    ShieldCheck,
    MessageSquare,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Building2,
    Smartphone,
    Scale,
    LifeBuoy,
} from "lucide-react";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export default function ComplianceAcademy() {
    const tenDlcSteps = [
        {
            title: "Brand Registration",
            description: "Submit your legal entity information (EIN, Address, Website) to get verified for SMS.",
            status: "Foundational",
            icon: Building2,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
            borderColor: "border-blue-500/20"
        },
        {
            title: "Campaign Submission",
            description: "Define your use case (e.g., Marketing, Notifications) and provide sample messages for review.",
            status: "Verification",
            icon: MessageSquare,
            color: "text-violet-500",
            bgColor: "bg-violet-500/10",
            borderColor: "border-violet-500/20"
        },
        {
            title: "Number Matching",
            description: "Assign your high-deliverability numbers to your approved campaign.",
            status: "Activation",
            icon: Smartphone,
            color: "text-emerald-500",
            bgColor: "bg-emerald-500/10",
            borderColor: "border-emerald-500/20"
        }
    ];

    const complianceRules = [
        {
            title: "Prior Express Consent",
            description: "You must have documented permission before sending any non-essential outreach.",
            icon: CheckCircle2,
            severity: "Critical"
        },
        {
            title: "Clear Opt-Out",
            description: "Every initial message must include 'Reply STOP to unsubscribe' or similar language.",
            icon: AlertCircle,
            severity: "Required"
        },
        {
            title: "Identification",
            description: "Always identify your company in the first message of a sequence.",
            icon: ShieldCheck,
            severity: "Required"
        }
    ];

    return (
        <div className="space-y-12 pb-32">
            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600/20 via-background to-violet-600/10 border border-white/10 p-10 md:p-14"
            >
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="flex-1 space-y-4 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mx-auto md:mx-0">
                            <Scale className="w-3.5 h-3.5" />
                            Legal & Compliance
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                            Compliance <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400 italic">Academy</span>
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
                            Master the regulatory landscape of SMS and Email outreach. Get verified, stay compliant, and ensure your messages always land in the inbox.
                        </p>
                    </div>
                </div>
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-500/10 blur-[120px] pointer-events-none" />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* 10DLC Track */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <h3 className="text-2xl font-black flex items-center gap-3">
                            <Smartphone className="w-6 h-6 text-blue-400" />
                            10DLC Path-to-Live
                        </h3>
                        <Badge variant="outline" className="text-[10px] uppercase tracking-widest font-black text-gray-500 border-white/10 px-3 py-1">
                            Carrier Approved
                        </Badge>
                    </div>

                    <div className="relative space-y-6">
                        {tenDlcSteps.map((step, idx) => (
                            <motion.div
                                key={step.title}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={cn(
                                    "relative p-8 rounded-3xl border bg-white/[0.02] transition-all hover:bg-white/[0.05] group",
                                    step.borderColor
                                )}
                            >
                                <div className="flex items-start gap-6">
                                    <div className={cn("p-4 rounded-2xl transition-transform group-hover:scale-110 duration-500", step.bgColor, step.color)}>
                                        <step.icon className="w-7 h-7" />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-black text-xl tracking-tight">{step.title}</h4>
                                            <Badge variant="secondary" className="text-[10px] uppercase font-black py-1 px-3">
                                                {step.status}
                                            </Badge>
                                        </div>
                                        <p className="text-gray-400 text-sm leading-relaxed max-w-xl">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                                {idx < tenDlcSteps.length - 1 && (
                                    <div className="absolute -bottom-6 left-14 w-px h-6 bg-gradient-to-b from-white/10 to-transparent hidden md:block" />
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* TCPA Rules */}
                <div className="space-y-8">
                    <div className="flex items-center border-b border-white/5 pb-4">
                        <h3 className="text-2xl font-black flex items-center gap-3">
                            <ShieldCheck className="w-6 h-6 text-emerald-400" />
                            Outreach Guards
                        </h3>
                    </div>

                    <Card className="bg-white/[0.02] border-white/10 overflow-hidden shadow-2xl">
                        <CardHeader className="bg-white/5 p-8 border-b border-white/5">
                            <CardTitle className="text-lg font-black tracking-tight text-white uppercase italic">The Golden Rules</CardTitle>
                            <CardDescription className="text-xs font-medium text-gray-500">Industry standards for high deliverability.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-white/5">
                                {complianceRules.map((rule) => (
                                    <div key={rule.title} className="p-6 space-y-3 group hover:bg-white/[0.03] transition-all cursor-default">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                                                    <rule.icon className="w-4 h-4" />
                                                </div>
                                                <span className="font-black text-sm uppercase tracking-tight">{rule.title}</span>
                                            </div>
                                            <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[9px] font-black px-2 py-0.5 uppercase tracking-widest">
                                                {rule.severity}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-gray-400 leading-relaxed pl-10 group-hover:text-gray-300 transition-colors">
                                            {rule.description}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="p-8 bg-blue-500/[0.03] border-t border-white/5 mt-auto">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 flex-shrink-0">
                                        <LifeBuoy className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-black uppercase tracking-tight">Need assistance?</p>
                                        <p className="text-xs text-gray-400 leading-relaxed">
                                            Our compliance team reviews all 10DLC applications before submission to ensure your brand gets verified instantly.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Opt-out Management Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            >
                <Card className="bg-gradient-to-r from-emerald-500/5 to-transparent border-emerald-500/20 overflow-hidden">
                    <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20">
                                <MessageSquare className="w-10 h-10 text-emerald-400" />
                            </div>
                            <div className="flex-1 space-y-2 text-center md:text-left">
                                <h3 className="text-xl font-bold">Automated Opt-out Handling</h3>
                                <p className="text-gray-400 text-sm max-w-2xl">
                                    BasaltCRM automatically detects keywords like **STOP**, **QUIT**, and **UNSUBSCRIBE**. When a lead replies with these, our system instantly flags them and prevents further outreach to protect your reputation.
                                </p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-3">
                                {["STOP", "REMOVE", "CANCEL"].map(word => (
                                    <Badge key={word} variant="secondary" className="px-3 py-1 bg-black/40 text-emerald-400 font-mono tracking-widest">
                                        {word}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
