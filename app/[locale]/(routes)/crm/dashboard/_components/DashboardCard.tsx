"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import React from "react";

export type CardVariant = "default" | "success" | "info" | "violet" | "warning";

interface DashboardCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: LucideIcon;
    label: string;
    count?: number | string;
    description?: string;
    variant?: CardVariant;
    primaryColor?: string;
    iconClassName?: string;
}

const variantIconStyles: Record<CardVariant, string> = {
    default: "text-muted-foreground group-hover:text-foreground",
    success: "text-emerald-500",
    info: "text-cyan-500",
    violet: "text-violet-500",
    warning: "text-amber-500",
};

const DashboardCard = React.forwardRef<HTMLButtonElement, DashboardCardProps>(
    ({ className, icon: Icon, label, count, description, variant = "default", iconClassName, primaryColor, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "relative group w-full p-4 overflow-hidden transition-all duration-300",
                    "bg-[#09090b] border border-[#27272a] hover:border-primary/50 rounded-3xl", // Dark aesthetic
                    "h-[120px]", // Compact height
                    className
                )}
                {...props}
            >
                {/* Giant Watermark Icon (Gray/Muted) - Positioned Right */}
                <Icon
                    className="absolute -right-6 -bottom-6 w-40 h-40 -rotate-12 text-muted-foreground/5 group-hover:text-muted-foreground/10 transition-colors duration-500 pointer-events-none"
                />

                <div className="relative z-10 grid grid-cols-3 w-full h-full items-center">
                    {/* Left: Stats */}
                    <div className="col-span-1 flex flex-col items-start justify-center h-full pl-2">
                        <div className="flex items-baseline gap-1">
                            {count !== undefined && (
                                <span className="text-3xl font-bold tracking-tight text-foreground">
                                    {count}
                                </span>
                            )}
                        </div>
                        {description && (
                            <p className="text-[10px] text-muted-foreground font-medium truncate max-w-full opacity-80 mt-1">
                                {description}
                            </p>
                        )}
                    </div>

                    {/* Center: Icon & Name */}
                    <div className="col-span-1 flex flex-col items-center justify-center gap-2">
                        <div className="group-hover:scale-110 transition-transform duration-300">
                            <div className={cn(
                                "w-12 h-12 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center shadow-inner ring-1 ring-white/10",
                                "backdrop-blur-sm",
                                primaryColor ? primaryColor : variantIconStyles[variant]
                            )}>
                                <Icon className={cn("w-6 h-6", iconClassName)} />
                            </div>
                        </div>
                        <h3 className="font-semibold text-[10px] uppercase tracking-widest text-muted-foreground/90 text-center">
                            {label}
                        </h3>
                    </div>

                    {/* Right: Spacer (Empty to balance grid, acts as padding for Center alignment) */}
                    <div className="col-span-1" />
                </div>

                {/* Subtle Glow on Hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </button>
        );
    }
);

DashboardCard.displayName = "DashboardCard";

export default DashboardCard;
