"use client";

import { Handle, Position } from "@xyflow/react";
import { CheckCircle2 } from "lucide-react";

interface ApprovalNodeProps {
    data: {
        label?: string;
        processName?: string;
    };
}

export function ApprovalNode({ data }: ApprovalNodeProps) {
    return (
        <div className="px-4 py-3 shadow-lg rounded-lg bg-rose-50 dark:bg-rose-950 border-2 border-rose-300 dark:border-rose-700 min-w-[180px]">
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 !bg-rose-400 border-2 border-white"
            />
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-100 dark:bg-rose-900 rounded">
                    <CheckCircle2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                    <div className="text-xs text-rose-500 font-medium">APPROVAL</div>
                    <div className="text-sm font-semibold text-rose-900 dark:text-rose-100">
                        {data?.label || "Submit for Approval"}
                    </div>
                    {data?.processName && (
                        <div className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
                            Process: {data.processName}
                        </div>
                    )}
                </div>
            </div>
            {/* Approved path */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="approved"
                style={{ left: '30%' }}
                className="w-3 h-3 !bg-green-400 border-2 border-white"
            />
            {/* Rejected path */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="rejected"
                style={{ left: '70%' }}
                className="w-3 h-3 !bg-red-400 border-2 border-white"
            />
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground px-1">
                <span className="text-green-600">Approved</span>
                <span className="text-red-500">Rejected</span>
            </div>
        </div>
    );
}
