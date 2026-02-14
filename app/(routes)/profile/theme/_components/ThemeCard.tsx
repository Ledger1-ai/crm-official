"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ThemeCardProps {
    id: string;
    name: string;
    description: string;
    colors: string[]; // Array of Tailwind color classes for the dots
    isActive: boolean;
    onClick: () => void;
}

export function ThemeCard({
    id,
    name,
    description,
    colors,
    isActive,
    onClick,
}: ThemeCardProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "relative flex flex-col items-start gap-3 p-4 rounded-xl border transition-all duration-200",
                "bg-card/50 hover:bg-card/80",
                isActive
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border/50 hover:border-border"
            )}
        >
            {/* Color Dots */}
            <div className="flex items-center gap-1.5">
                {colors.map((color, idx) => (
                    <span
                        key={idx}
                        className={cn("w-4 h-4 rounded-full", color)}
                    />
                ))}
            </div>

            {/* Text */}
            <div className="text-left">
                <p className="font-medium text-foreground">{name}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>

            {/* Checkmark */}
            {isActive && (
                <div className="absolute top-3 right-3 text-primary">
                    <Check className="w-5 h-5" />
                </div>
            )}
        </button>
    );
}
