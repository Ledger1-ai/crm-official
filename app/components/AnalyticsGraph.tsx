"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { TrendingUp, DollarSign, CheckCircle2, BarChart3, PieChart, Activity, Target, ArrowUpRight } from "lucide-react";

export default function AnalyticsGraph() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => (prev + 1) % 8);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const metrics = [
        { label: "Revenue", value: "$124K", change: "+23%", color: "emerald" },
        { label: "Deals", value: "47", change: "+12%", color: "teal" },
        { label: "Win Rate", value: "68%", change: "+8%", color: "green" },
    ];

    const barData = [65, 82, 45, 93, 58, 77, 88];

    return (
        <div className="relative w-full h-full p-4 flex flex-col gap-3 overflow-hidden bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex gap-2 items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Predictive AI Active
                </div>
            </div>

            {/* Metric Cards */}
            <div className="flex gap-3">
                {metrics.map((metric, index) => (
                    <motion.div
                        key={metric.label}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg p-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{
                            opacity: step > index ? 1 : 0.3,
                            y: step > index ? 0 : 10,
                            borderColor: step === index ? "rgba(16,185,129,0.6)" : "rgba(255,255,255,0.1)",
                        }}
                    >
                        <div className="text-xs text-muted-foreground mb-1">{metric.label}</div>
                        <div className="flex items-end justify-between">
                            <span className="text-lg font-bold text-white">{metric.value}</span>
                            <span className="text-xs text-emerald-400 flex items-center">
                                <ArrowUpRight className="w-3 h-3" />
                                {metric.change}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Chart Area */}
            <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 relative flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Revenue Forecast</div>
                    <div className="flex items-center gap-2">
                        <motion.div
                            animate={{
                                opacity: step >= 4 ? 1 : 0.5,
                            }}
                            className="flex items-center gap-1 text-xs text-emerald-400"
                        >
                            <Activity className="w-3 h-3" />
                            <span>95% Accuracy</span>
                        </motion.div>
                    </div>
                </div>


                {/* Bar Chart */}
                <div className="flex-1 grid grid-cols-7 w-full relative mb-2 min-h-[60px]">
                    {barData.map((value, index) => (
                        <div key={index} className="h-full relative px-1 flex items-end">
                            <motion.div
                                className="w-full bg-emerald-500/20 rounded-t relative overflow-hidden"
                                initial={{ height: 0 }}
                                animate={{
                                    height: step >= 3 ? `${value}%` : 0,
                                }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <motion.div
                                    className="absolute bottom-0 left-0 right-0 bg-emerald-500"
                                    initial={{ height: 0 }}
                                    animate={{
                                        height: step >= 4 ? "100%" : 0,
                                    }}
                                    transition={{ duration: 0.3, delay: index * 0.1 + 0.5 }}
                                />
                            </motion.div>
                        </div>
                    ))}

                    {/* Trend Line covering Bars - Generated Dynamically from Bar Data */}
                    <AnimatePresence>
                        {step >= 3 && (
                            <motion.svg
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 w-full h-full pointer-events-none z-10"
                            >
                                <motion.path
                                    d="M 0 80 Q 25 90 50 50 T 100 20"
                                    stroke="rgba(255,255,255,0.9)"
                                    strokeWidth="2"
                                    fill="none"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1.5, ease: "easeInOut" }}
                                />
                            </motion.svg>
                        )}
                    </AnimatePresence>
                </div>

                {/* RSI Subchart - Compact height */}
                <div className="h-6 border-t border-white/10 pt-1 relative mt-1">
                    <div className="absolute top-1 left-0 text-[8px] font-mono text-emerald-500/70">RSI</div>
                    <motion.svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        className="w-full h-full overflow-visible"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: step >= 3 ? 1 : 0 }}
                    >
                        <motion.path
                            d="M 0 50 C 20 30, 20 70, 40 50 S 60 30, 80 50 S 100 70, 100 50"
                            fill="none"
                            stroke="rgba(16,185,129,0.9)"
                            strokeWidth="1.5"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: step >= 3 ? 1 : 0 }}
                            transition={{ duration: 1.5, ease: "linear" }}
                        />
                    </motion.svg>
                </div>
            </div>

            {/* Sentiment & Pipeline Status */}
            <div className="grid grid-cols-2 gap-3">
                <motion.div
                    className="bg-white/5 border border-white/10 rounded-lg p-3"
                    animate={{
                        borderColor: step === 6 ? "rgba(16,185,129,0.6)" : "rgba(255,255,255,0.1)",
                    }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-medium text-white">Sentiment</span>
                    </div>
                    <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="flex-1 h-2 rounded-full bg-emerald-500/20"
                                initial={{ opacity: 0 }}
                                animate={{
                                    opacity: step >= 6 ? 1 : 0.3,
                                    backgroundColor: step >= 6 && i < 4 ? "rgba(16,185,129,0.8)" : "rgba(16,185,129,0.2)",
                                }}
                                transition={{ delay: i * 0.1 }}
                            />
                        ))}
                    </div>
                    <div className="text-xs text-emerald-400 mt-1">Highly Positive</div>
                </motion.div>

                <motion.div
                    className="bg-white/5 border border-white/10 rounded-lg p-3"
                    animate={{
                        borderColor: step === 6 ? "rgba(16,185,129,0.6)" : "rgba(255,255,255,0.1)",
                    }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-medium text-white">Pipeline</span>
                    </div>
                    <div className="w-full h-2 bg-emerald-500/20 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-emerald-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: step >= 6 ? "78%" : "0%" }}
                            transition={{ duration: 0.8 }}
                        />
                    </div>
                    <div className="text-xs text-emerald-400 mt-1">78% to Goal</div>
                </motion.div>
            </div>

            {/* Prediction Result - Absolute Positioned to prevent layout shift */}
            <AnimatePresence>
                {step >= 7 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-4 left-4 right-4 z-20 bg-gradient-to-r from-emerald-950/90 to-green-900/90 backdrop-blur-md p-4 rounded-xl border border-emerald-500/50 flex items-center justify-between shadow-2xl"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <DollarSign className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-white">Q4 Forecast</div>
                                <div className="text-xs text-emerald-200">$485K projected revenue</div>
                            </div>
                        </div>
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
