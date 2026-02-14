import React from "react";
import { LucideIcon } from "lucide-react";

export type ProjectCardData = {
    title: string;
    description: string;
    icon: LucideIcon;
    color: string;
    iconColor: string;
};

export const ProjectCard = ({ card, loading = false }: { card: ProjectCardData, loading?: boolean }) => (
    <div className="group relative overflow-hidden rounded-2xl border border-[#27272a] bg-[#09090b] p-3 transition-all duration-300 h-[110px] w-full cursor-pointer">
        {/* Giant Watermark Icon - Positioned Right */}
        <card.icon
            className={`absolute -right-4 -bottom-4 w-32 h-32 -rotate-12 transition-colors duration-500 pointer-events-none opacity-10 group-hover:opacity-20 ${card.iconColor}`}
        />

        <div className="relative z-10 w-full h-full flex flex-col justify-center items-start pl-1">
            <div className="space-y-0.5">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90 group-hover:text-foreground transition-colors">
                    {card.title}
                </span>
                <span className="block text-xl font-bold tracking-tight text-foreground">
                    {card.description}
                </span>
            </div>
        </div>

        {/* Subtle Glow on Hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
);
