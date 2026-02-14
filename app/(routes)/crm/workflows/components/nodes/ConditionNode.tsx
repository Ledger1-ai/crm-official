"use client";

import { Handle, Position } from "@xyflow/react";
import { GitBranch } from "lucide-react";

interface ConditionNodeProps {
    data: {
        label?: string;
        field?: string;
        operator?: string;
        value?: string;
    };
}

export function ConditionNode({ data }: ConditionNodeProps) {
    return (
        <div className="px-4 py-3 shadow-lg rounded-lg bg-amber-50 dark:bg-amber-950 border-2 border-amber-300 dark:border-amber-700 min-w-[180px]">
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 !bg-amber-400 border-2 border-white"
            />
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 dark:bg-amber-900 rounded">
                    <GitBranch className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                    <div className="text-xs text-amber-500 font-medium">CONDITION</div>
                    <div className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                        {data?.label || "If / Else"}
                    </div>
                    {data?.field && (
                        <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            {data.field} {data.operator} {data.value}
                        </div>
                    )}
                </div>
            </div>
            {/* True path */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="true"
                style={{ left: '30%' }}
                className="w-3 h-3 !bg-green-400 border-2 border-white"
            />
            {/* False path */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="false"
                style={{ left: '70%' }}
                className="w-3 h-3 !bg-red-400 border-2 border-white"
            />
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground px-1">
                <span className="text-green-600">Yes</span>
                <span className="text-red-500">No</span>
            </div>
        </div>
    );
}
