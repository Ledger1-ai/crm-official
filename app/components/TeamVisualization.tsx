"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Users, Zap, Globe, Code, Sparkles, Heart, Coffee, Rocket } from "lucide-react";

export default function TeamVisualization() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => (prev + 1) % 8);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const teamMembers = [
        { x: 25, y: 30, color: "cyan", delay: 0 },
        { x: 75, y: 30, color: "purple", delay: 0.2 },
        { x: 25, y: 70, color: "yellow", delay: 0.4 },
        { x: 75, y: 70, color: "emerald", delay: 0.6 },
        { x: 50, y: 50, color: "pink", delay: 0.8 },
    ];

    const floatingIcons = [
        { Icon: Code, x: 15, y: 20, color: "text-cyan-400" },
        { Icon: Globe, x: 85, y: 25, color: "text-purple-400" },
        { Icon: Zap, x: 10, y: 80, color: "text-yellow-400" },
        { Icon: Rocket, x: 90, y: 75, color: "text-emerald-400" },
        { Icon: Coffee, x: 50, y: 15, color: "text-orange-400" },
        { Icon: Heart, x: 50, y: 85, color: "text-pink-400" },
    ];

    return (
        <div className="relative w-full h-full bg-gradient-to-br from-cyan-900/30 via-purple-900/20 to-teal-900/30 rounded-2xl overflow-hidden">
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full">
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" className="text-white" />
                </svg>
            </div>

            {/* Connection Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {teamMembers.map((member, i) =>
                    teamMembers.slice(i + 1).map((other, j) => (
                        <motion.line
                            key={`${i}-${j}`}
                            x1={`${member.x}%`}
                            y1={`${member.y}%`}
                            x2={`${other.x}%`}
                            y2={`${other.y}%`}
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="1"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{
                                pathLength: step >= 2 ? 1 : 0,
                                opacity: step >= 2 ? 0.3 : 0,
                            }}
                            transition={{ duration: 0.8, delay: (i + j) * 0.1 }}
                        />
                    ))
                )}
            </svg>

            {/* Data Pulses Along Lines */}
            <AnimatePresence>
                {step >= 4 && (
                    <>
                        <motion.div
                            className="absolute w-2 h-2 bg-cyan-400 rounded-full"
                            initial={{ left: "25%", top: "30%" }}
                            animate={{
                                left: ["25%", "50%", "75%"],
                                top: ["30%", "50%", "30%"],
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            style={{ filter: "blur(1px)", boxShadow: "0 0 10px rgba(6,182,212,0.8)" }}
                        />
                        <motion.div
                            className="absolute w-2 h-2 bg-purple-400 rounded-full"
                            initial={{ left: "75%", top: "70%" }}
                            animate={{
                                left: ["75%", "50%", "25%"],
                                top: ["70%", "50%", "70%"],
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.5 }}
                            style={{ filter: "blur(1px)", boxShadow: "0 0 10px rgba(168,85,247,0.8)" }}
                        />
                    </>
                )}
            </AnimatePresence>

            {/* Team Member Nodes */}
            {teamMembers.map((member, index) => (
                <motion.div
                    key={index}
                    className="absolute"
                    style={{ left: `${member.x}%`, top: `${member.y}%`, transform: "translate(-50%, -50%)" }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                        scale: step >= 1 ? 1 : 0,
                        opacity: step >= 1 ? 1 : 0,
                    }}
                    transition={{ duration: 0.5, delay: member.delay }}
                >
                    <motion.div
                        className={`w-12 h-12 rounded-full bg-${member.color}-500/20 border-2 border-${member.color}-500/50 flex items-center justify-center backdrop-blur-sm`}
                        animate={{
                            scale: step === 3 + index % 3 ? [1, 1.2, 1] : 1,
                            borderColor: step === 3 + index % 3 ? [`rgba(255,255,255,0.5)`, `rgba(6,182,212,1)`, `rgba(255,255,255,0.5)`] : "rgba(255,255,255,0.3)",
                        }}
                        transition={{ duration: 0.6 }}
                        style={{
                            background: `radial-gradient(circle at center, rgba(255,255,255,0.1), transparent)`,
                            boxShadow: `0 0 20px rgba(6,182,212,0.2)`,
                        }}
                    >
                        <Users className="w-5 h-5 text-white/70" />
                    </motion.div>
                </motion.div>
            ))}

            {/* Floating Icons */}
            {floatingIcons.map((item, index) => (
                <motion.div
                    key={index}
                    className="absolute"
                    style={{ left: `${item.x}%`, top: `${item.y}%`, transform: "translate(-50%, -50%)" }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                        opacity: step >= 5 ? 0.6 : 0,
                        y: step >= 5 ? [0, -5, 0] : 10,
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                >
                    <item.Icon className={`w-5 h-5 ${item.color}`} />
                </motion.div>
            ))}

            {/* Central Hub */}
            <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                initial={{ scale: 0 }}
                animate={{ scale: step >= 3 ? 1 : 0 }}
                transition={{ type: "spring", stiffness: 200 }}
            >
                <motion.div
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-white/20 flex items-center justify-center backdrop-blur-md"
                    animate={{
                        boxShadow: step >= 4
                            ? ["0 0 20px rgba(6,182,212,0.3)", "0 0 40px rgba(6,182,212,0.5)", "0 0 20px rgba(6,182,212,0.3)"]
                            : "0 0 20px rgba(6,182,212,0.3)",
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <Sparkles className="w-8 h-8 text-primary" />
                </motion.div>
            </motion.div>

            {/* Stats Overlay */}
            <AnimatePresence>
                {step >= 6 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-4 left-4 right-4 flex justify-between"
                    >
                        <div className="bg-black/40 backdrop-blur-md rounded-lg px-3 py-2 border border-white/10">
                            <div className="text-xs text-gray-400">Team Size</div>
                            <div className="text-lg font-bold text-white">24+</div>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md rounded-lg px-3 py-2 border border-white/10">
                            <div className="text-xs text-gray-400">Countries</div>
                            <div className="text-lg font-bold text-white">8</div>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md rounded-lg px-3 py-2 border border-white/10">
                            <div className="text-xs text-gray-400">Open Roles</div>
                            <div className="text-lg font-bold text-primary">5</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header Badge */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md rounded-full px-4 py-1.5 border border-white/10 flex items-center gap-2"
            >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-white/70">Building the Future</span>
            </motion.div>
        </div>
    );
}
