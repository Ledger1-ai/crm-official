"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { CheckCircle2, MessageSquare, Phone, Mail, DollarSign, Heart, Zap, User } from "lucide-react";

export default function AbstractDashboard() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => (prev + 1) % 5); // 5 steps now
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full h-full p-6 flex flex-col gap-6 overflow-hidden bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2 items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                        Sales AI Active
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                        Support AI Active
                    </div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-8 relative">
                {/* Left Track: Sales (Outbound) */}
                <div className="flex flex-col gap-4 relative">
                    <div className="text-xs font-bold text-cyan-500 uppercase tracking-wider mb-2">Outbound Sales</div>

                    {/* Lead Card */}
                    <motion.div
                        className="bg-white/5 border border-white/10 p-3 rounded-lg flex items-center gap-3"
                        animate={{
                            borderColor: step === 0 ? "rgba(6,182,212,0.8)" : "rgba(255,255,255,0.1)",
                            x: step === 0 ? [0, 10, 0] : 0,
                        }}
                    >
                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                            <User className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                            <div className="w-20 h-2 bg-white/10 rounded mb-1" />
                            <div className="w-12 h-1.5 bg-white/5 rounded" />
                        </div>
                    </motion.div>

                    {/* Action: Email/Call */}
                    <AnimatePresence>
                        {step >= 1 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex flex-col gap-2 pl-4 border-l-2 border-cyan-500/30"
                            >
                                <div className="flex items-center gap-2 text-xs text-cyan-300">
                                    <Mail className="w-3 h-3" />
                                    <span>AI Sending Personalized Email...</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Result: Deal Closed */}
                    <AnimatePresence>
                        {step >= 3 && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="mt-auto bg-gradient-to-r from-cyan-900/50 to-cyan-800/50 p-4 rounded-xl border border-cyan-500/50 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-black font-bold">
                                        <DollarSign className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">Deal Closed</div>
                                        <div className="text-xs text-cyan-200">$12,500 ARR</div>
                                    </div>
                                </div>
                                <CheckCircle2 className="w-6 h-6 text-cyan-400" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Track: Support (Inbound) */}
                <div className="flex flex-col gap-4 relative">
                    <div className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-2">Inbound Support</div>

                    {/* Ticket Card */}
                    <motion.div
                        className="bg-white/5 border border-white/10 p-3 rounded-lg flex items-center gap-3"
                        animate={{
                            borderColor: step === 0 ? "rgba(168,85,247,0.8)" : "rgba(255,255,255,0.1)",
                            x: step === 0 ? [0, -10, 0] : 0,
                        }}
                    >
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <MessageSquare className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="flex-1">
                            <div className="w-24 h-2 bg-white/10 rounded mb-1" />
                            <div className="w-16 h-1.5 bg-white/5 rounded" />
                        </div>
                    </motion.div>

                    {/* Action: Analysis */}
                    <AnimatePresence>
                        {step >= 1 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex flex-col gap-2 pl-4 border-l-2 border-purple-500/30"
                            >
                                <div className="flex items-center gap-2 text-xs text-purple-300">
                                    <Zap className="w-3 h-3" />
                                    <span>AI Analyzing Sentiment...</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Result: Issue Resolved */}
                    <AnimatePresence>
                        {step >= 3 && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="mt-auto bg-gradient-to-r from-purple-900/50 to-purple-800/50 p-4 rounded-xl border border-purple-500/50 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                                        <Heart className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">Issue Resolved</div>
                                        <div className="text-xs text-purple-200">5-Star Rating</div>
                                    </div>
                                </div>
                                <CheckCircle2 className="w-6 h-6 text-purple-400" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Central Brain (Connecting both) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <motion.div
                        className="w-24 h-24 rounded-full bg-black/80 backdrop-blur-md border border-white/20 flex items-center justify-center relative z-10"
                        animate={{
                            boxShadow: step === 2
                                ? ["0 0 0px rgba(255,255,255,0)", "0 0 50px rgba(6,182,212,0.5)", "0 0 50px rgba(168,85,247,0.5)", "0 0 0px rgba(255,255,255,0)"]
                                : "none"
                        }}
                        transition={{ duration: 1 }}
                    >
                        <div className="relative w-full h-full flex items-center justify-center">
                            <Zap className={`w-10 h-10 ${step === 2 ? "text-white" : "text-muted-foreground"} transition-colors duration-300`} />
                            {/* Connecting beams */}
                            {step === 2 && (
                                <>
                                    <motion.div className="absolute top-1/2 left-0 w-[200px] h-[2px] bg-cyan-500 origin-right -translate-x-full" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} />
                                    <motion.div className="absolute top-1/2 right-0 w-[200px] h-[2px] bg-purple-500 origin-left translate-x-full" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} />
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
