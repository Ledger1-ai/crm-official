"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MoveLeft } from "lucide-react";
import GeometricBackground from "@/app/[locale]/components/GeometricBackground";

export default function NotFound() {
    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background text-foreground">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <GeometricBackground />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center p-6 space-y-8 max-w-lg mx-auto">
                {/* Glitchy 404 Text Effect */}
                <h1 className="text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 animate-pulse">
                    404
                </h1>

                <div className="space-y-4">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                        Page not found
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button
                        asChild
                        variant="default"
                        size="lg"
                        className="group bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full px-8"
                    >
                        <Link href="/">
                            <MoveLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Home
                        </Link>
                    </Button>

                    <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="rounded-full px-8 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white"
                    >
                        <Link href="/support">
                            Contact Support
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />
        </div>
    );
}
