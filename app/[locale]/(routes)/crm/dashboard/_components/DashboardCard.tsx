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
    hideIcon?: boolean;
}

const variantIconStyles: Record<CardVariant, string> = {
    default: "text-muted-foreground group-hover:text-foreground",
    success: "text-emerald-500",
    info: "text-cyan-500",
    violet: "text-violet-500",
    warning: "text-amber-500",
};

const DashboardCard = React.forwardRef<HTMLButtonElement, DashboardCardProps>(
    ({ className, icon: Icon, label, count, description, variant = "default", iconClassName, primaryColor, hideIcon = false, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "relative group w-full p-3 overflow-hidden transition-all duration-300",
                    "bg-[#09090b] border border-[#27272a] hover:border-primary/50 rounded-2xl", // Reduced radius
                    "h-[110px]", // More compact height
                    className
                )}
                {...props}
            >
                {/* Giant Watermark Icon (Colorful) - Positioned Right */}
                <Icon
                    className={cn(
                        "absolute -right-4 -bottom-4 w-32 h-32 -rotate-12 transition-colors duration-500 pointer-events-none",
                        variant === "default" && "text-muted-foreground/5 group-hover:text-muted-foreground/10",
                        variant === "success" && "text-emerald-500/10 group-hover:text-emerald-500/20",
                        variant === "info" && "text-cyan-500/10 group-hover:text-cyan-500/20",
                        variant === "violet" && "text-violet-500/10 group-hover:text-violet-500/20",
                        variant === "warning" && "text-amber-500/10 group-hover:text-amber-500/20"
                    )}
                />

                <div className={cn("relative z-10 w-full h-full flex flex-col justify-center", hideIcon ? "items-center text-center gap-1" : "items-start pl-1")}>
                    {hideIcon ? (
                        // Centered Layout (Stats/Deep Dive)
                        <>
                            <h3 className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground/90 mb-0.5">
                                {label}
                            </h3>
                            {count !== undefined && (
                                <span className="text-3xl font-bold tracking-tight text-foreground">
                                    {count}
                                </span>
                            )}
                            {description && (
                                <p className="text-[9px] text-muted-foreground font-medium opacity-80">
                                    {description}
                                </p>
                            )}
                        </>
                    ) : (
                        // Clean List Layout (Entities/Icons) - Left Aligned, No Central Icon
                        <>
                            <div className="flex items-center gap-2 mb-0.5">
                                <h3 className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground/90">
                                    {label}
                                </h3>
                            </div>

                            <div className="flex items-baseline gap-1">
                                {count !== undefined && (
                                    <span className="text-3xl font-bold tracking-tight text-foreground">
                                        {count}
                                    </span>
                                )}
                            </div>

                            {description && (
                                <p className="text-[9px] text-muted-foreground font-medium truncate max-w-full opacity-80 mt-0.5">
                                    {description}
                                </p>
                            )}
                        </>
                    )}
                </div>

                {/* Subtle Glow on Hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </button>
        );
    }
);

DashboardCard.displayName = "DashboardCard";

export default DashboardCard;
