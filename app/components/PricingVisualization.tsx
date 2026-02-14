"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Sparkles, Zap, Crown, Building2, Users, Bot, BarChart3, Shield } from "lucide-react";

export default function PricingVisualization() {
    const [step, setStep] = useState(0);
    const [selectedPlan, setSelectedPlan] = useState(1);

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => (prev + 1) % 6);
            if (step === 5) {
                setSelectedPlan((prev) => (prev + 1) % 3);
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [step]);

    const plans = [
        { name: "Starter", icon: Zap, color: "gray", features: 3 },
        { name: "Pro", icon: Crown, color: "cyan", features: 5 },
        { name: "Enterprise", icon: Building2, color: "purple", features: 7 },
    ];

    const features = [
        { icon: Users, label: "Users", values: ["3", "10", "∞"] },
        { icon: Bot, label: "AI Credits", values: ["500", "5K", "∞"] },
        { icon: BarChart3, label: "Analytics", values: ["Basic", "Advanced", "Custom"] },
        { icon: Shield, label: "Support", values: ["Community", "Priority", "24/7"] },
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
                    Plan Comparison
                </div>
            </div>

            {/* Plan Selector */}
            <div className="flex gap-2">
                {plans.map((plan, index) => (
                    <motion.div
                        key={plan.name}
                        className={`flex-1 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedPlan === index
                                ? "bg-primary/20 border-primary"
                                : "bg-white/5 border-white/10 hover:border-white/20"
                        }`}
                        animate={{
                            scale: selectedPlan === index ? 1.02 : 1,
                        }}
                        onClick={() => setSelectedPlan(index)}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <plan.icon className={`w-4 h-4 ${selectedPlan === index ? "text-primary" : "text-gray-500"}`} />
                            <span className={`text-sm font-medium ${selectedPlan === index ? "text-white" : "text-gray-400"}`}>
                                {plan.name}
                            </span>
                        </div>
                        <div className="flex gap-1">
                            {[...Array(plan.features)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className={`w-1.5 h-1.5 rounded-full ${
                                        selectedPlan === index ? "bg-primary" : "bg-gray-600"
                                    }`}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                />
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Feature Comparison */}
            <div className="flex-1 flex flex-col gap-3">
                {features.map((feature, index) => (
                    <motion.div
                        key={feature.label}
                        className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                            <feature.icon className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="flex-1">
                            <div className="text-xs text-gray-500 mb-1">{feature.label}</div>
                            <motion.div
                                key={selectedPlan}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-sm font-medium text-white"
                            >
                                {feature.values[selectedPlan]}
                            </motion.div>
                        </div>
                        <div className="flex gap-1">
                            {feature.values.map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-2 h-2 rounded-full ${
                                        i <= selectedPlan
                                            ? i === selectedPlan
                                                ? "bg-primary"
                                                : "bg-primary/30"
                                            : "bg-gray-700"
                                    }`}
                                />
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Value Meter */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">Value Score</span>
                    <motion.span
                        key={selectedPlan}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs font-mono text-primary"
                    >
                        {selectedPlan === 0 ? "Good" : selectedPlan === 1 ? "Best Value" : "Premium"}
                    </motion.span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: `${(selectedPlan + 1) * 33}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </div>
        </div>
    );
}
