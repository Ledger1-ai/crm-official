"use client";

import { Handle, Position } from "@xyflow/react";
import { LayoutGrid } from "lucide-react";

interface ScreenNodeProps {
    data: {
        label?: string;
        screenTitle?: string;
        fields?: { name: string; type: string; required?: boolean }[];
    };
}

export function ScreenNode({ data }: ScreenNodeProps) {
    const fields = data?.fields || [];

    return (
        <div className="px-4 py-3 shadow-lg rounded-lg bg-purple-50 dark:bg-purple-950 border-2 border-purple-300 dark:border-purple-700 min-w-[200px] max-w-[260px]">
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 !bg-purple-400 border-2 border-white"
            />
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 dark:bg-purple-900 rounded">
                    <LayoutGrid className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                    <div className="text-xs text-purple-500 font-medium">SCREEN</div>
                    <div className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                        {data?.label || "User Input"}
                    </div>
                </div>
            </div>
            {fields.length > 0 && (
                <div className="mt-2 space-y-1 border-t border-purple-200 dark:border-purple-800 pt-2">
                    {fields.slice(0, 4).map((field, i) => (
                        <div key={i} className="flex items-center gap-1 text-xs text-purple-700 dark:text-purple-300">
                            <div className="w-1 h-1 rounded-full bg-purple-400" />
                            {field.name}
                            {field.required && <span className="text-red-400">*</span>}
                        </div>
                    ))}
                    {fields.length > 4 && (
                        <div className="text-xs text-purple-400">+{fields.length - 4} more</div>
                    )}
                </div>
            )}
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 !bg-purple-400 border-2 border-white"
            />
        </div>
    );
}
