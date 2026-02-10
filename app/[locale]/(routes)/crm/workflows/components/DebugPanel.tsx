"use client";

import { useState } from "react";
import {
    X, Bug, Play, CheckCircle2, AlertCircle, Clock, ChevronDown,
    ChevronRight, Eye, Trash2, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export interface ExecutionStep {
    nodeId: string;
    nodeType: string;
    label: string;
    status: "running" | "completed" | "failed" | "skipped" | "waiting";
    startTime: number;
    endTime?: number;
    inputData?: Record<string, unknown>;
    outputData?: Record<string, unknown>;
    error?: string;
    branch?: string; // "true" | "false" | "approved" | "rejected" | "body" | "done"
}

export interface ExecutionLog {
    id: string;
    flowId: string;
    flowName: string;
    status: "running" | "completed" | "failed";
    startTime: number;
    endTime?: number;
    steps: ExecutionStep[];
    triggerData?: Record<string, unknown>;
}

interface DebugPanelProps {
    execution: ExecutionLog | null;
    isOpen: boolean;
    onClose: () => void;
    onHighlightNode: (nodeId: string) => void;
    onClear: () => void;
}

const statusColors: Record<string, { text: string; bg: string; icon: typeof CheckCircle2 }> = {
    running: { text: "text-blue-500", bg: "bg-blue-500/10", icon: Loader2 },
    completed: { text: "text-green-500", bg: "bg-green-500/10", icon: CheckCircle2 },
    failed: { text: "text-red-500", bg: "bg-red-500/10", icon: AlertCircle },
    skipped: { text: "text-slate-400", bg: "bg-slate-400/10", icon: ChevronRight },
    waiting: { text: "text-amber-500", bg: "bg-amber-500/10", icon: Clock },
};

function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

function formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString();
}

export function DebugPanel({ execution, isOpen, onClose, onHighlightNode, onClear }: DebugPanelProps) {
    const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

    if (!isOpen) return null;

    const toggleStep = (idx: number) => {
        const next = new Set(expandedSteps);
        if (next.has(idx)) next.delete(idx);
        else next.add(idx);
        setExpandedSteps(next);
    };

    return (
        <div className="w-full border-t bg-card shadow-lg animate-in slide-in-from-bottom-4 duration-200 max-h-[40vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30 shrink-0">
                <div className="flex items-center gap-2">
                    <Bug className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-semibold">Debug Console</span>
                    {execution && (
                        <>
                            <Separator orientation="vertical" className="h-4" />
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-[10px]",
                                    execution.status === "running" && "border-blue-500 text-blue-500",
                                    execution.status === "completed" && "border-green-500 text-green-500",
                                    execution.status === "failed" && "border-red-500 text-red-500",
                                )}
                            >
                                {execution.status === "running" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                {execution.status.toUpperCase()}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                                {execution.steps.length} step{execution.steps.length !== 1 ? "s" : ""}
                                {execution.endTime && execution.startTime
                                    ? ` · ${formatDuration(execution.endTime - execution.startTime)}`
                                    : ""}
                            </span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onClear}>
                        <Trash2 className="h-3 w-3" /> Clear
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Body */}
            <ScrollArea className="flex-1">
                {!execution ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Bug className="h-8 w-8 text-muted-foreground/40 mb-3" />
                        <p className="text-sm text-muted-foreground">No execution yet</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Click <span className="font-mono text-primary">Run</span> to execute this FlowState and see results here
                        </p>
                    </div>
                ) : (
                    <div className="p-3">
                        {/* Trigger Data */}
                        {execution.triggerData && Object.keys(execution.triggerData).length > 0 && (
                            <Collapsible className="mb-3">
                                <CollapsibleTrigger className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground w-full">
                                    <ChevronDown className="h-3 w-3" />
                                    Trigger Payload
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-1">
                                    <pre className="text-[11px] font-mono bg-muted/50 p-2 rounded border overflow-x-auto">
                                        {JSON.stringify(execution.triggerData, null, 2)}
                                    </pre>
                                </CollapsibleContent>
                            </Collapsible>
                        )}

                        {/* Execution Timeline */}
                        <div className="space-y-1">
                            {execution.steps.map((step, idx) => {
                                const statusInfo = statusColors[step.status] || statusColors.waiting;
                                const StatusIcon = statusInfo.icon;
                                const isExpanded = expandedSteps.has(idx);
                                const duration = step.endTime && step.startTime
                                    ? formatDuration(step.endTime - step.startTime)
                                    : null;

                                return (
                                    <div key={idx} className="group">
                                        {/* Step row */}
                                        <button
                                            className={cn(
                                                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors hover:bg-muted/50",
                                                isExpanded && "bg-muted/30",
                                            )}
                                            onClick={() => toggleStep(idx)}
                                        >
                                            {/* Timeline connector */}
                                            <div className="relative flex flex-col items-center">
                                                <div className={cn(
                                                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                                                    statusInfo.bg,
                                                )}>
                                                    <StatusIcon className={cn(
                                                        "h-3 w-3",
                                                        statusInfo.text,
                                                        step.status === "running" && "animate-spin",
                                                    )} />
                                                </div>
                                            </div>

                                            {/* Step info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium truncate">
                                                        {step.label}
                                                    </span>
                                                    <Badge variant="outline" className="text-[9px] shrink-0">
                                                        {step.nodeType}
                                                    </Badge>
                                                    {step.branch && (
                                                        <Badge variant="secondary" className="text-[9px] shrink-0">
                                                            → {step.branch}
                                                        </Badge>
                                                    )}
                                                </div>
                                                {step.error && (
                                                    <div className="text-[10px] text-red-500 truncate mt-0.5">
                                                        ⚠ {step.error}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Duration & actions */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                {duration && (
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {duration}
                                                    </span>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onHighlightNode(step.nodeId);
                                                    }}
                                                >
                                                    <Eye className="h-3 w-3" />
                                                </Button>
                                                {isExpanded ? (
                                                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                                ) : (
                                                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                                )}
                                            </div>
                                        </button>

                                        {/* Expanded detail */}
                                        {isExpanded && (
                                            <div className="ml-11 mr-3 mb-2 space-y-2">
                                                <div className="text-[10px] text-muted-foreground">
                                                    Started: {formatTime(step.startTime)}
                                                    {step.endTime && ` · Ended: ${formatTime(step.endTime)}`}
                                                </div>
                                                {step.inputData && Object.keys(step.inputData).length > 0 && (
                                                    <div>
                                                        <div className="text-[10px] font-medium text-muted-foreground mb-1">Input</div>
                                                        <pre className="text-[10px] font-mono bg-muted/40 p-2 rounded border overflow-x-auto max-h-24">
                                                            {JSON.stringify(step.inputData, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                                {step.outputData && Object.keys(step.outputData).length > 0 && (
                                                    <div>
                                                        <div className="text-[10px] font-medium text-muted-foreground mb-1">Output</div>
                                                        <pre className="text-[10px] font-mono bg-muted/40 p-2 rounded border overflow-x-auto max-h-24">
                                                            {JSON.stringify(step.outputData, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                                {step.error && (
                                                    <div className="p-2 rounded bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800">
                                                        <div className="text-[10px] font-medium text-red-600 mb-1">Error</div>
                                                        <pre className="text-[10px] font-mono text-red-500 whitespace-pre-wrap">
                                                            {step.error}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
