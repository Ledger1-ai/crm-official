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
                "group relative overflow-hidden rounded-xl border p-3 md:p-4 text-left transition-all duration-300 w-full flex flex-col items-center justify-center gap-2",
                // Glassmorphism base
                "backdrop-blur-md",
                // Active vs Inactive state
                isActive
                    ? cn("bg-white/10 ring-1 opacity-100 scale-[1.02]", borderColor, shadowColor, "shadow-[0_0_20px_-5px]")
                    : cn("bg-white/5 opacity-80 hover:opacity-100 hover:bg-white/10 hover:shadow-lg", borderColor && borderColor.replace("border-", "border-").replace("/50", "/30"), shadowColor && shadowColor.replace("shadow-", "shadow-").replace("/20", "/5"))
            )}
        >
            {/* Background Gradient */}
            <div
                className={cn(
                    "absolute inset-0 bg-gradient-to-br transition-opacity duration-300",
                    isActive ? "opacity-100" : "opacity-25 group-hover:opacity-75",
                    gradient
                )}
            />

            {/* Icon Container */}
            <div
                className={cn(
                    "relative z-10 p-2.5 rounded-full transition-transform duration-300 group-hover:scale-110",
                    // Glassy icon container
                    "bg-white/5 border border-white/10 shadow-sm",
                    isActive ? cn("scale-110 ring-1", borderColor) : ""
                )}
            >
                <Icon className={cn("w-5 h-5 md:w-6 md:h-6", color)} />
            </div>

            {/* Label */}
            <span
                className={cn(
                    "relative z-10 text-xs md:text-sm font-medium transition-colors text-center",
                    isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
                )}
            >
                {label}
            </span>
        </button>
    );
};
