"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { CheckCircle2, Clock, Circle, Rocket, Sparkles, ArrowRight, Zap, Bot, Globe } from "lucide-react";

export default function RoadmapVisualization() {
    const [step, setStep] = useState(0);
    const [activeQuarter, setActiveQuarter] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => (prev + 1) % 8);
            if (step === 7) {
                setActiveQuarter((prev) => (prev + 1) % 4);
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [step]);

    const quarters = [
        { label: "Q4 2025", status: "done", icon: CheckCircle2, color: "emerald", features: ["Voice AI", "Mobile App"] },
        { label: "Q1 2026", status: "current", icon: Clock, color: "cyan", features: ["Teams Integration", "Sentiment AI"] },
        { label: "Q2 2026", status: "upcoming", icon: Circle, color: "purple", features: ["Multi-Currency", "White-Label"] },
        { label: "Q3 2026", status: "upcoming", icon: Rocket, color: "pink", features: ["AR/VR Meetings", "Plugin Marketplace"] },
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
                    <Sparkles className="w-3 h-3 text-primary" />
                    Product Roadmap
                </div>
            </div>

            {/* Timeline Track */}
            <div className="relative h-16">
                {/* Base Line */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -translate-y-1/2" />
                
                {/* Progress Line */}
                <motion.div
                    className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500 -translate-y-1/2"
                    initial={{ width: "0%" }}
                    animate={{ width: `${(activeQuarter + 1) * 25}%` }}
                    transition={{ duration: 0.5 }}
                />

                {/* Quarter Markers */}
                {quarters.map((quarter, index) => (
                    <motion.div
                        key={quarter.label}
                        className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
                        style={{ left: `${index * 25 + 12.5}%` }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <motion.div
                            className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                                index <= activeQuarter
                                    ? `bg-${quarter.color}-500/30 border-2 border-${quarter.color}-500`
                                    : "bg-white/5 border-2 border-white/20"
                            }`}
                            animate={{
                                scale: index === activeQuarter ? [1, 1.15, 1] : 1,
                                boxShadow: index === activeQuarter 
                                    ? ["0 0 0px rgba(6,182,212,0)", "0 0 20px rgba(6,182,212,0.5)", "0 0 0px rgba(6,182,212,0)"]
                                    : "none",
                            }}
                            transition={{ duration: 1.5, repeat: index === activeQuarter ? Infinity : 0 }}
                            onClick={() => setActiveQuarter(index)}
                        >
                            <quarter.icon className={`w-4 h-4 ${
                                index <= activeQuarter ? `text-${quarter.color}-400` : "text-gray-500"
                            }`} />
                        </motion.div>
                        <span className={`text-xs mt-2 font-medium ${
                            index === activeQuarter ? "text-white" : "text-gray-500"
                        }`}>
                            {quarter.label}
                        </span>
                    </motion.div>
                ))}
            </div>

            {/* Feature Display */}
            <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeQuarter}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="h-full flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full bg-${quarters[activeQuarter].color}-500`} />
                                <span className="text-sm font-medium text-white">{quarters[activeQuarter].label}</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                                quarters[activeQuarter].status === "done"
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : quarters[activeQuarter].status === "current"
                                        ? "bg-cyan-500/20 text-cyan-400"
                                        : "bg-gray-500/20 text-gray-400"
                            }`}>
                                {quarters[activeQuarter].status === "done" ? "Completed" : 
                                 quarters[activeQuarter].status === "current" ? "In Progress" : "Planned"}
                            </span>
                        </div>

                        <div className="flex-1 grid grid-cols-2 gap-3">
                            {quarters[activeQuarter].features.map((feature, index) => (
                                <motion.div
                                    key={feature}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`bg-${quarters[activeQuarter].color}-500/10 border border-${quarters[activeQuarter].color}-500/30 rounded-lg p-3 flex items-center gap-2`}
                                >
                                    <div className={`w-8 h-8 rounded-lg bg-${quarters[activeQuarter].color}-500/20 flex items-center justify-center`}>
                                        {index === 0 ? (
                                            <Bot className={`w-4 h-4 text-${quarters[activeQuarter].color}-400`} />
                                        ) : (
                                            <Globe className={`w-4 h-4 text-${quarters[activeQuarter].color}-400`} />
                                        )}
                                    </div>
                                    <span className="text-sm text-white">{feature}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Progress Bar */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">2025-2026 Progress</span>
                    <span className="text-xs font-mono text-primary">{Math.round((activeQuarter + 1) * 25)}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: `${(activeQuarter + 1) * 25}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </div>
        </div>
    );
}
