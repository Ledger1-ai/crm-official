"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TabNavigationCardProps {
    id: string;
    label: string;
    icon: LucideIcon;
    color: string;      // Tailwind color class for text/icon (e.g., "text-blue-500")
    gradient: string;   // Tailwind gradient classes (e.g., "from-blue-500/20")
    borderColor: string; // Tailwind border color class
    shadowColor: string; // Tailwind shadow color class
    isActive: boolean;
    onClick: () => void;
}

export default function TabNavigationCard({
    label,
    icon: Icon,
    color,
    gradient,
    borderColor,
    shadowColor,
    isActive,
    onClick,
}: TabNavigationCardProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "group relative overflow-hidden rounded-2xl border transition-all duration-300 h-[100px] w-full flex flex-col justify-center items-center text-center",
                isActive
                    ? cn("bg-[#09090b] border-primary/50 ring-1 ring-primary/20 scale-[1.02] shadow-lg shadow-primary/10")
                    : cn("bg-[#09090b]/60 border-[#27272a] hover:border-primary/30 opacity-90 hover:opacity-100")
            )}
        >
            {/* Giant Watermark Icon - Positioned Right */}
            <Icon
                className={cn(
                    "absolute -right-4 -bottom-4 w-28 h-28 -rotate-12 transition-all duration-500 pointer-events-none",
                    isActive ? "opacity-20 scale-110" : "opacity-5 group-hover:opacity-10",
                    color
                )}
            />

            <div className="relative z-10 w-full px-2 text-center">
                <span
                    className={cn(
                        "block text-lg font-bold tracking-tight transition-colors",
                        isActive ? "text-foreground" : "text-muted-foreground/80 group-hover:text-foreground"
                    )}
                >
                    {label}
                </span>
            </div>

            {/* Subtle Glow on Hover */}
            <div className={cn(
                "absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transition-opacity duration-500 pointer-events-none",
                isActive ? "opacity-20" : "opacity-0 group-hover:opacity-100"
            )} />
        </button>
    );
};
