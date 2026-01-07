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
    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 md:p-6 hover:bg-white/10 transition-all duration-300 backdrop-blur-md shadow-lg hover:shadow-xl hover:scale-[1.02] text-left w-full h-full cursor-pointer">
        <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-20 group-hover:opacity-60 transition-opacity duration-300`} />
        <div className="relative z-10 flex flex-col items-center justify-center space-y-2 text-center h-full">
            <div className={`p-3 rounded-full bg-gradient-to-br ${card.color} border border-white/10 shadow-lg group-hover:scale-110 transition-transform duration-300 ${card.iconColor} ring-1 ring-white/20 group-hover:ring-white/40`}>
                <card.icon className={`w-6 h-6 md:w-8 md:h-8 ${loading ? "animate-spin" : ""}`} strokeWidth={1.5} />
            </div>
            <div className="space-y-0.5">
                <span className="block text-sm md:text-lg font-medium text-foreground group-hover:text-white transition-colors">
                    {card.title}
                </span>
                <span className="block text-[10px] md:text-xs text-muted-foreground group-hover:text-white/80 transition-colors">
                    {card.description}
                </span>
            </div>
        </div>
    </div>
);
