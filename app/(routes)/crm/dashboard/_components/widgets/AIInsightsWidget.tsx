"use client";

import React from "react";
import { WidgetWrapper } from "./WidgetWrapper";
import { Zap, AlertCircle, CheckCircle2, Info, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface AIInsightsWidgetProps {
    insights: any[];
}

export const AIInsightsWidget = ({ insights = [] }: AIInsightsWidgetProps) => {
    const router = useRouter();

    const getIcon = (type: string) => {
        switch (type) {
            case "warning": return <AlertCircle size={16} className="text-amber-400" />;
            case "success": return <CheckCircle2 size={16} className="text-emerald-400" />;
            default: return <Info size={16} className="text-blue-400" />;
        }
    };

    return (
        <WidgetWrapper title="AI Command" icon={Zap} iconColor="text-violet-400">
            <div className="space-y-3 pt-2">
                {insights.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground italic py-4 text-center">Scanning for insights...</p>
                ) : (
                    insights.map((insight) => (
                        <div
                            key={insight.id}
                            className="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-violet-500/30 hover:bg-white/10 transition-all cursor-pointer group"
                            onClick={() => router.push(insight.actionHref)}
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5">
                                    {getIcon(insight.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[11px] font-bold text-white/90 uppercase tracking-wider">{insight.title}</h4>
                                    <p className="text-[12px] text-muted-foreground line-clamp-2 mt-1 italic leading-snug">
                                        "{insight.description}"
                                    </p>
                                    <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {insight.action} <ChevronRight size={10} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </WidgetWrapper>
    );
};
