"use client";

import React from "react";
import { WidgetWrapper } from "./WidgetWrapper";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export const TeamActivityWidget = ({ activity = [] }: { activity?: any[] }) => {
    const items = activity;

    return (
        <WidgetWrapper title="Team Activity" icon={Activity} iconColor="text-indigo-400">
            <div className="space-y-4 pt-2">
                {items.map((item, index) => (
                    <div key={index} className="flex gap-3 text-sm group">
                        <div className="min-w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-300 border border-indigo-500/10">
                            {item.user.charAt(0)}
                        </div>
                        <div className="flex-1 space-y-0.5">
                            <p className="text-white/80 line-clamp-1">
                                <span className="font-semibold text-white">{item.user}</span> {item.action}
                            </p>
                            <p className="text-indigo-300 text-xs font-medium truncate group-hover:text-indigo-200 transition-colors">
                                {item.target}
                            </p>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap pt-0.5">
                            {item.time}
                        </span>
                    </div>
                ))}
            </div>
        </WidgetWrapper>
    );
};
