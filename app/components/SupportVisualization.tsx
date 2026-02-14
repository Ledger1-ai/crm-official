"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { MessageSquare, Bot, CheckCircle2, Send, User, Sparkles, ThumbsUp, Clock } from "lucide-react";

export default function SupportVisualization() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => (prev + 1) % 8);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const messages = [
        { type: "user", text: "How do I integrate with Slack?" },
        { type: "bot", text: "I can help! Here are the steps to connect Slack..." },
        { type: "bot", text: "1. Go to Settings → Integrations\n2. Click 'Connect Slack'\n3. Authorize access" },
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
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    AI Support Active
                </div>
            </div>

            {/* Chat Header */}
            <div className="bg-gradient-to-r from-primary/20 to-purple-500/20 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                <motion.div
                    className="w-12 h-12 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center"
                    animate={{
                        scale: step >= 1 && step <= 3 ? [1, 1.1, 1] : 1,
                    }}
                    transition={{ duration: 0.5, repeat: step >= 1 && step <= 3 ? Infinity : 0 }}
                >
                    <Bot className="w-6 h-6 text-primary" />
                </motion.div>
                <div className="flex-1">
                    <div className="text-sm font-medium text-white">Luna - AI Assistant</div>
                    <div className="text-xs text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Online • Avg. response: &lt;10s
                    </div>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    24/7
                </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                <AnimatePresence>
                    {step >= 1 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-2 justify-end"
                        >
                            <div className="bg-primary/20 rounded-xl rounded-br-sm p-3 max-w-[80%]">
                                <p className="text-sm text-white">{messages[0].text}</p>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                                <User className="w-3 h-3 text-gray-300" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {step >= 2 && step < 4 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex gap-2"
                        >
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-3 h-3 text-primary" />
                            </div>
                            <div className="bg-white/5 rounded-xl rounded-bl-sm p-3 flex items-center gap-2">
                                <motion.div
                                    className="flex gap-1"
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                >
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {step >= 4 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-2"
                        >
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-3 h-3 text-primary" />
                            </div>
                            <div className="bg-white/5 rounded-xl rounded-bl-sm p-3 max-w-[80%]">
                                <p className="text-sm text-gray-300">{messages[1].text}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {step >= 5 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-2"
                        >
                            <div className="w-6 h-6 flex-shrink-0" />
                            <div className="bg-white/5 rounded-xl p-3 max-w-[85%] border border-white/10">
                                <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">{messages[2].text}</pre>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {step >= 6 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-2 justify-end"
                        >
                            <div className="bg-emerald-500/20 rounded-xl p-3 flex items-center gap-2">
                                <ThumbsUp className="w-4 h-4 text-emerald-400" />
                                <span className="text-sm text-emerald-300">That helped!</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                <input
                    type="text"
                    placeholder="Ask anything..."
                    className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
                    disabled
                />
                <motion.button
                    className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Send className="w-4 h-4 text-black" />
                </motion.button>
            </div>

            {/* Resolution Badge */}
            <AnimatePresence>
                {step >= 7 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-emerald-900/50 to-green-900/50 p-3 rounded-xl border border-emerald-500/50 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-black" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-white">Issue Resolved</div>
                                <div className="text-xs text-emerald-200">Response time: 8 seconds</div>
                            </div>
                        </div>
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
