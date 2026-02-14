"use client";

import { Handle, Position } from "@xyflow/react";
import { Repeat } from "lucide-react";

interface LoopNodeProps {
    data: {
        label?: string;
        collection?: string;
        iteratorVariable?: string;
    };
}

export function LoopNode({ data }: LoopNodeProps) {
    return (
        <div className="px-4 py-3 shadow-lg rounded-lg bg-indigo-50 dark:bg-indigo-950 border-2 border-indigo-300 dark:border-indigo-700 min-w-[180px]">
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 !bg-indigo-400 border-2 border-white"
            />
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900 rounded">
                    <Repeat className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <div className="text-xs text-indigo-500 font-medium">LOOP</div>
                    <div className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
                        {data?.label || "For Each"}
                    </div>
                    {data?.collection && (
                        <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                            over: {data.collection}
                        </div>
                    )}
                </div>
            </div>
            {/* Loop body path */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="body"
                style={{ left: '30%' }}
                className="w-3 h-3 !bg-indigo-400 border-2 border-white"
            />
            {/* After loop path */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="done"
                style={{ left: '70%' }}
                className="w-3 h-3 !bg-slate-400 border-2 border-white"
            />
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground px-1">
                <span className="text-indigo-600">Each Item</span>
                <span className="text-slate-500">After Loop</span>
            </div>
        </div>
    );
}
