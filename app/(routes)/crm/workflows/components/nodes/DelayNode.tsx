"use client";

import { Handle, Position } from "@xyflow/react";
import { Clock } from "lucide-react";

interface DelayNodeProps {
    data: {
        label?: string;
        duration?: number;
        unit?: "minutes" | "hours" | "days";
    };
}

export function DelayNode({ data }: DelayNodeProps) {
    return (
        <div className="px-4 py-3 shadow-lg rounded-lg bg-blue-50 dark:bg-blue-950 border-2 border-blue-300 dark:border-blue-700 min-w-[160px]">
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 !bg-blue-400 border-2 border-white"
            />
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <div className="text-xs text-blue-500 font-medium">DELAY</div>
                    <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                        {data?.label || "Wait"}
                    </div>
                </div>
            </div>
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 !bg-blue-400 border-2 border-white"
            />
        </div>
    );
}
