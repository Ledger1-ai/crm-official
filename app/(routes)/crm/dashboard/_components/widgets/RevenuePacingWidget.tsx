"use client";

import React from "react";
import { WidgetWrapper } from "./WidgetWrapper";
import { TrendingUp, DollarSign } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const RevenuePacingWidget = ({
    currentRevenue = 0,
    targetRevenue = 0,
    projectedEOM = 0,
    daysLeft = 0
}: {
    currentRevenue?: number,
    targetRevenue?: number,
    projectedEOM?: number,
    daysLeft?: number
}) => {
    const progress = targetRevenue > 0 ? (currentRevenue / targetRevenue) * 100 : 0;

    return (
        <WidgetWrapper title="Revenue Pacing" icon={TrendingUp} iconColor="text-emerald-400">
            <div className="space-y-6 pt-4">
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground pb-1">Current Period</p>
                        <div className="flex items-center gap-1 text-2xl font-bold text-white tracking-tight">
                            <span className="text-muted-foreground font-normal text-lg">$</span>
                            {(currentRevenue).toLocaleString()}
                        </div>
                    </div>
                    {/* Hiding trend until data available */}
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Pacing vs Target</span>
                        <span>{Math.round(progress)}% of ${targetRevenue.toLocaleString()}</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-white/5" indicatorClassName="bg-gradient-to-r from-emerald-500 to-teal-400" />
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4 mt-2">
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Projected EOM</p>
                        <p className="text-sm font-medium text-white">${projectedEOM.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">Days Remaining</p>
                        <p className="text-sm font-medium text-white">{daysLeft} Days</p>
                    </div>
                </div>
            </div>
        </WidgetWrapper>
    );
};
