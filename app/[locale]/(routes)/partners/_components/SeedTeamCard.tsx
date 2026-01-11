"use client";

import React, { useState } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { seedInternalTeam } from "@/actions/teams/seed-team";

export const SeedTeamCard = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSeed = async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            const res = await seedInternalTeam();
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(`Internal Team Seeded! Updated ${res.count} users.`);
                router.refresh();
            }
        } catch (error) {
            toast.error("Failed to seed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            onClick={handleSeed}
            className={cn(
                "group relative overflow-hidden rounded-xl border border-border bg-card p-4 md:p-6 hover:bg-accent/50 transition-all duration-300 backdrop-blur-md shadow-lg hover:shadow-xl hover:scale-[1.02] text-left w-full h-full cursor-pointer"
            )}
        >
            <div className={`absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 opacity-20 group-hover:opacity-60 transition-opacity duration-300`} />
            <div className="relative z-10 flex flex-col items-center justify-center space-y-2 text-center h-full">
                <div className={`p-3 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-border shadow-lg group-hover:scale-110 transition-transform duration-300 text-amber-400 ring-1 ring-white/20 group-hover:ring-white/40`}>
                    <Lock className={`w-6 h-6 md:w-8 md:h-8 ${isLoading ? "animate-spin" : ""}`} strokeWidth={1.5} />
                </div>
                <div className="space-y-0.5">
                    <span className="block text-sm md:text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                        Seed Internal Team
                    </span>
                    <span className="block text-[10px] md:text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">
                        Initialize internal team data
                    </span>
                </div>
            </div>
        </div>
    );
};
