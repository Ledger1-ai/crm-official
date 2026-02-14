"use client";

import { Handle, Position } from "@xyflow/react";
import { Database } from "lucide-react";

interface UpdateRecordNodeProps {
    data: {
        label?: string;
        objectType?: string;
        operation?: "CREATE" | "UPDATE" | "DELETE" | "GET";
        fieldUpdates?: { field: string; value: string }[];
    };
}

const opColors = {
    CREATE: "text-emerald-600",
    UPDATE: "text-blue-600",
    DELETE: "text-red-600",
    GET: "text-slate-600",
};

export function UpdateRecordNode({ data }: UpdateRecordNodeProps) {
    const op = data?.operation || "UPDATE";
    const updates = data?.fieldUpdates || [];

    return (
        <div className="px-4 py-3 shadow-lg rounded-lg bg-cyan-50 dark:bg-cyan-950 border-2 border-cyan-300 dark:border-cyan-700 min-w-[180px]">
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 !bg-cyan-400 border-2 border-white"
            />
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-cyan-100 dark:bg-cyan-900 rounded">
                    <Database className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                    <div className="text-xs text-cyan-500 font-medium">{op} RECORD</div>
                    <div className="text-sm font-semibold text-cyan-900 dark:text-cyan-100">
                        {data?.label || data?.objectType || "Record Operation"}
                    </div>
                </div>
            </div>
            {updates.length > 0 && (
                <div className="mt-2 space-y-1 border-t border-cyan-200 dark:border-cyan-800 pt-2">
                    {updates.slice(0, 3).map((u, i) => (
                        <div key={i} className="text-xs text-cyan-700 dark:text-cyan-300">
                            <span className="font-medium">{u.field}</span> → {u.value}
                        </div>
                    ))}
                </div>
            )}
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 !bg-cyan-400 border-2 border-white"
            />
        </div>
    );
}
