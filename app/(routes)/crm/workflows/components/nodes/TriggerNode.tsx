"use client";

import { Handle, Position } from "@xyflow/react";
import { Zap } from "lucide-react";

interface TriggerNodeProps {
    data: {
        label?: string;
        triggerType?: string;
    };
}

export function TriggerNode({ data }: TriggerNodeProps) {
    return (
        <div className="px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-orange-500 to-red-500 border-2 border-orange-600 min-w-[180px]">
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded">
                    <Zap className="h-4 w-4 text-white" />
                </div>
                <div>
                    <div className="text-xs text-orange-100 font-medium">TRIGGER</div>
                    <div className="text-sm font-bold text-white">{data?.label || "Trigger"}</div>
                </div>
            </div>
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 !bg-orange-300 border-2 border-white"
            />
        </div>
    );
}
