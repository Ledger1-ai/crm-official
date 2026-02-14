"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Use the slug we assigned in the JSON config
const FORM_SLUG = "crecoin-airdrop-season-2";

export default function AirdropLandingPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-[#F54029]/30 flex flex-col items-center justify-center p-6 text-center">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#F54029]/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-xl w-full space-y-8 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F54029]/10 border border-[#F54029]/20 mb-4">
                    <span className="w-2 h-2 bg-[#F54029] rounded-full animate-pulse" />
                    <span className="text-[10px] font-mono tracking-[0.2em] text-[#F54029] uppercase">
                        Action Required
                    </span>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                        WE HAVE <br />
                        <span className="bg-gradient-to-r from-[#F54029] to-[#ff8c00] bg-clip-text text-transparent">
                            RELOCATED
                        </span>
                    </h1>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        The Airdrop application has moved to its permanent home on the official Crecoin mission control.
                    </p>
                </div>

                <div className="glass-panel p-8 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl space-y-6">
                    <p className="text-sm font-mono text-gray-500 uppercase tracking-widest">Permanent Link:</p>
                    <a
                        href="https://crecoin.co/airdrop.html"
                        className="block group"
                    >
                        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.03] group-hover:border-[#F54029]/50 group-hover:bg-[#F54029]/5 transition-all duration-300">
                            <span className="text-xl font-bold text-white group-hover:text-[#F54029] transition-colors">
                                crecoin.co/airdrop.html
                            </span>
                        </div>
                    </a>

                    <Button
                        asChild
                        className="w-full h-14 bg-[#F54029] hover:bg-[#ff6b57] text-white text-lg font-bold tracking-[0.2em] rounded-2xl shadow-[0_0_30px_rgba(245,64,41,0.2)] hover:shadow-[0_0_50px_rgba(245,64,41,0.4)] transition-all duration-300"
                    >
                        <a href="https://crecoin.co/airdrop.html">
                            GO TO NEW FORM <ArrowRight className="ml-2 h-5 w-5" />
                        </a>
                    </Button>
                </div>

                <p className="text-xs text-gray-600 font-mono tracking-[0.3em] uppercase pt-8">
                    CRECOIN FOUNDATION x BASALT CRM
                </p>
            </div>
        </div>
    );
}
