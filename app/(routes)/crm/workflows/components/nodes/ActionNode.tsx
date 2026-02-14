"use client";

import { Handle, Position } from "@xyflow/react";
import { Mail, MessageSquare, CheckSquare, Bell } from "lucide-react";

interface ActionNodeProps {
    data: {
        label?: string;
        actionType?: "send_email" | "send_sms" | "create_task" | "notify";
    };
}

const actionIcons = {
    send_email: Mail,
    send_sms: MessageSquare,
    create_task: CheckSquare,
    notify: Bell,
};

export function ActionNode({ data }: ActionNodeProps) {
    const Icon = actionIcons[data?.actionType || "notify"] || Bell;

    return (
        <div className="px-4 py-3 shadow-lg rounded-lg bg-green-50 dark:bg-green-950 border-2 border-green-300 dark:border-green-700 min-w-[160px]">
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 !bg-green-400 border-2 border-white"
            />
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded">
                    <Icon className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                    <div className="text-xs text-green-500 font-medium">ACTION</div>
                    <div className="text-sm font-semibold text-green-900 dark:text-green-100">
                        {data?.label || "Action"}
                    </div>
                </div>
            </div>
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 !bg-green-400 border-2 border-white"
            />
        </div>
    );
}
