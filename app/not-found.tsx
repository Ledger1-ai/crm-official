"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MoveLeft } from "lucide-react";
import { motion } from "framer-motion";
import GeometricBackground from "@/app/components/GeometricBackground";

export default function NotFound() {
    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background text-foreground">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <GeometricBackground />
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6 text-center">
                {/* Error Code with Glow */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative mb-8"
                >
                    <h1 className="text-[12rem] md:text-[16rem] font-black tracking-tighter leading-none select-none text-white/5">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <h2 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 drop-shadow-2xl">
                            LOST?
                        </h2>
                    </div>
                    {/* Pulsing Glitch Effect */}
                    <div className="absolute inset-0 bg-primary/20 blur-[100px] animate-pulse rounded-full pointer-events-none" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="max-w-2xl space-y-8"
                >
                    <div className="space-y-4">
                        <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white uppercase font-mono">
                            <span className="text-primary mr-2">/</span> Signal Lost in Transit
                        </h3>
                        <p className="text-gray-400 text-lg md:text-xl leading-relaxed max-w-lg mx-auto">
                            The requested resource has been moved or purged from the neural network.
                            Let's get you back to the command center.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
                        <Link
                            href="/"
                            className="h-14 px-10 flex items-center justify-center text-sm font-black tracking-[0.2em] rounded-xl bg-primary text-black hover:bg-primary/90 shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_50px_rgba(var(--primary-rgb),0.5)] transition-all duration-300 group"
                        >
                            <MoveLeft className="mr-3 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            RETURN TO HOME
                        </Link>

                        <Link
                            href="/support"
                            className="h-14 px-10 flex items-center justify-center text-sm font-black tracking-[0.2em] rounded-xl border border-white/10 text-white hover:bg-white/5 hover:border-white/20 hover:text-white transition-all duration-300 backdrop-blur-md"
                        >
                            CONTACT INTEL
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* Premium Decorative Blobs */}
            <div className="fixed -bottom-48 -left-48 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] pointer-events-none animate-pulse" />
            <div className="fixed -top-48 -right-48 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
    );
}
