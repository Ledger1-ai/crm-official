"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Search, Mail, UserPlus, CheckCircle2, Globe, Sparkles, Building2, ArrowRight } from "lucide-react";

export default function LeadGenDashboard() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => (prev + 1) % 6);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    const leads = [
        { company: "TechCorp", score: 92, status: "hot" },
        { company: "DataFlow", score: 87, status: "warm" },
        { company: "CloudSys", score: 78, status: "warm" },
    ];

    return (
        <div className="relative w-full h-full p-6 flex flex-col gap-4 overflow-hidden bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex gap-2 items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                    Lead Gen Active
                </div>
            </div>

            {/* Search/Scanning Animation */}
            <motion.div
                className="bg-white/5 border border-white/10 p-4 rounded-xl relative overflow-hidden"
                animate={{
                    borderColor: step === 0 ? "rgba(250,204,21,0.6)" : "rgba(255,255,255,0.1)",
                }}
            >
                <div className="flex items-center gap-3">
                    <motion.div
                        animate={{
                            rotate: step === 0 ? 360 : 0,
                        }}
                        transition={{ duration: 2, repeat: step === 0 ? Infinity : 0, ease: "linear" }}
                        className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center"
                    >
                        <Globe className="w-5 h-5 text-yellow-400" />
                    </motion.div>
                    <div className="flex-1">
                        <div className="text-sm font-medium text-white mb-1">Web Scanning</div>
                        <div className="flex items-center gap-2">
                            <motion.div
                                className="h-1.5 bg-yellow-500/30 rounded-full flex-1 overflow-hidden"
                            >
                                <motion.div
                                    className="h-full bg-yellow-500 rounded-full"
                                    animate={{
                                        width: step >= 1 ? "100%" : step === 0 ? ["0%", "100%"] : "0%",
                                    }}
                                    transition={{ duration: 2 }}
                                />
                            </motion.div>
                            <span className="text-xs text-yellow-400">{step >= 1 ? "Complete" : "Scanning..."}</span>
                        </div>
                    </div>
                </div>
                {step === 0 && (
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                )}
            </motion.div>

            {/* Lead Cards */}
            <div className="flex-1 flex flex-col gap-3">
                <div className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Discovered Leads</div>
                
                <AnimatePresence>
                    {leads.map((lead, index) => (
                        <motion.div
                            key={lead.company}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{
                                opacity: step > index ? 1 : 0,
                                x: step > index ? 0 : -20,
                            }}
                            className="bg-white/5 border border-white/10 p-3 rounded-lg flex items-center gap-3"
                        >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-yellow-400" />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-medium text-white">{lead.company}</div>
                                <div className="text-xs text-muted-foreground">Lead Score: {lead.score}%</div>
                            </div>
                            <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                                lead.status === "hot" 
                                    ? "bg-red-500/20 text-red-400" 
                                    : "bg-orange-500/20 text-orange-400"
                            }`}>
                                {lead.status.toUpperCase()}
                            </div>
                            {step >= index + 3 && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                >
                                    <Mail className="w-4 h-4 text-yellow-400" />
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Email Sent Notification */}
            <AnimatePresence>
                {step >= 5 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 p-4 rounded-xl border border-yellow-500/50 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-black" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-white">Personalized Emails Sent</div>
                                <div className="text-xs text-yellow-200">3 leads added to pipeline</div>
                            </div>
                        </div>
                        <CheckCircle2 className="w-6 h-6 text-yellow-400" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
