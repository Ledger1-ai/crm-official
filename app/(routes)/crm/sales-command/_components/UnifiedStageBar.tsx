"use client";

import React from "react";
import StageProgressBar, { StageDatum } from "@/components/StageProgressBar";
import { cn } from "@/lib/utils";

interface UnifiedStageBarProps {
    stages: Record<string, number>; // key: count
    total: number;
    className?: string;
    orientation?: "horizontal" | "vertical";
    height?: number;
}

const STAGE_LABELS: Record<string, string> = {
    Identify: "Identify",
    Engage_AI: "Engage AI",
    Engage_Human: "Engage Human",
    Offering: "Offering",
    Finalizing: "Finalizing",
    Closed: "Closed",
};

export function UnifiedStageBar({ stages, total, className, orientation = "vertical", height = 400 }: UnifiedStageBarProps) {
    // Transform Record<string, number> to StageDatum[]
    const stageData: StageDatum[] = Object.entries(STAGE_LABELS).map(([key, label]) => ({
        key: key as any,
        label,
        count: stages[key] || 0,
    }));

    return (
        <div className={cn("w-full", className)}>
            <StageProgressBar
                stages={stageData}
                total={total}
                orientation={orientation}
                trackHeight={height}
                showMetadata={true}
                nodeSize={24}
                coloringMode="activated" // Modern look
                activeStageKey="Identify" // Default base state
            />
        </div>
    );
}
