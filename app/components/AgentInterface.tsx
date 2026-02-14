"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Phone, MessageSquare, Mail, Bot, User, CheckCircle2, Clock, Mic, Volume2 } from "lucide-react";

export default function AgentInterface() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => (prev + 1) % 7);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const channels = [
        { icon: Phone, label: "Voice", color: "cyan", active: step >= 0 },
        { icon: MessageSquare, label: "SMS", color: "blue", active: step >= 1 },
        { icon: Mail, label: "Email", color: "purple", active: step >= 2 },
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
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                    AI Agent Online
                </div>
            </div>

            {/* Channel Status */}
            <div className="flex gap-3">
                {channels.map((channel, index) => (
                    <motion.div
                        key={channel.label}
                        className={`flex-1 bg-white/5 border rounded-lg p-3 flex flex-col items-center gap-2`}
                        animate={{
                            borderColor: channel.active ? `rgba(6,182,212,0.6)` : "rgba(255,255,255,0.1)",
                        }}
                    >
                        <channel.icon className={`w-5 h-5 ${channel.active ? "text-cyan-400" : "text-muted-foreground"}`} />
                        <span className={`text-xs ${channel.active ? "text-cyan-400" : "text-muted-foreground"}`}>
                            {channel.label}
                        </span>
                    </motion.div>
                ))}
            </div>

            {/* Active Call Simulation */}
            <motion.div
                className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-xl p-4 relative overflow-hidden"
                animate={{
                    borderColor: step === 3 ? "rgba(6,182,212,0.8)" : "rgba(6,182,212,0.3)",
                }}
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <motion.div
                            className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center"
                            animate={{
                                scale: step >= 3 && step <= 5 ? [1, 1.1, 1] : 1,
                            }}
                            transition={{ duration: 0.5, repeat: step >= 3 && step <= 5 ? Infinity : 0 }}
                        >
                            <Bot className="w-5 h-5 text-cyan-400" />
                        </motion.div>
                        <div>
                            <div className="text-sm font-medium text-white">AI Sales Agent</div>
                            <div className="text-xs text-cyan-300">
                                {step < 3 ? "Ready" : step <= 5 ? "On Call" : "Completed"}
                            </div>
                        </div>
                    </div>
                    {step >= 3 && step <= 5 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                            >
                                <Mic className="w-4 h-4 text-cyan-400" />
                            </motion.div>
                            <span className="text-xs text-cyan-400 font-mono">00:{String(step - 2).padStart(2, "0")}</span>
                        </motion.div>
                    )}
                </div>

                {/* Sound Wave Visualization */}
                {step >= 3 && step <= 5 && (
                    <div className="flex items-center justify-center gap-1 h-8">
                        {[...Array(12)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="w-1 bg-cyan-500 rounded-full"
                                animate={{
                                    // eslint-disable-next-line react-hooks/purity
                                    height: [8, Math.random() * 24 + 8, 8],
                                }}
                                transition={{
                                    duration: 0.5,
                                    repeat: Infinity,
                                    delay: i * 0.05,
                                }}
                            />
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Conversation Thread */}
            <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                <div className="text-xs font-bold text-cyan-500 uppercase tracking-wider">Live Conversation</div>

                <AnimatePresence>
                    {step >= 4 && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex gap-2"
                        >
                            <div className="w-6 h-6 rounded-full bg-gray-500/20 flex items-center justify-center flex-shrink-0">
                                <User className="w-3 h-3 text-gray-400" />
                            </div>
                            <div className="bg-white/5 rounded-lg p-2 text-xs text-muted-foreground max-w-[80%]">
                                Hi, I&apos;m interested in your product...
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {step >= 5 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex gap-2 justify-end"
                        >
                            <div className="bg-cyan-500/20 rounded-lg p-2 text-xs text-cyan-200 max-w-[80%]">
                                Great! I can schedule a demo for you right now. What time works best?
                            </div>
                            <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-3 h-3 text-cyan-400" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Appointment Booked */}
            <AnimatePresence>
                {step >= 6 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 p-4 rounded-xl border border-cyan-500/50 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-black" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-white">Demo Scheduled</div>
                                <div className="text-xs text-cyan-200">Tomorrow at 2:00 PM</div>
                            </div>
                        </div>
                        <CheckCircle2 className="w-6 h-6 text-cyan-400" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
