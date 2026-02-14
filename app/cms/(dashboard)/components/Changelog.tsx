"use client";

import { useEffect, useState } from "react";
import { getRecentActivities } from "@/actions/audit";
import { Loader2, History, User, Activity as ActivityIcon, Download } from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Activity {
    id: string;
    action: string;
    resource: string;
    details: string | null;
    createdAt: Date;
    user: {
        name: string | null;
        email: string;
        avatar: string | null;
    } | null;
}

export default function Changelog() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const data = await getRecentActivities();
                setActivities(data);
            } catch (error) {
                console.error("Failed to load changelog", error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, []);

    const getActionColor = (action: string) => {
        const lower = action.toLowerCase();
        if (lower.includes("create") || lower.includes("add") || lower.includes("upload") || lower.includes("invite")) return "bg-green-900/30 text-green-400";
        if (lower.includes("update") || lower.includes("edit") || lower.includes("modify")) return "bg-blue-900/30 text-blue-400";
        if (lower.includes("delete") || lower.includes("remove")) return "bg-red-900/30 text-red-400";
        return "bg-slate-800 text-gray-400";
    };

    if (loading) {
        return (
            <Card className="h-full border-0 shadow-none bg-transparent">
                <div className="flex items-center gap-2 mb-4 px-1">
                    <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
                        <History className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Activity Log</h2>
                        <p className="text-xs text-gray-500 font-medium">System tracking</p>
                    </div>
                </div>
                <CardContent className="h-[calc(100vh-12rem)] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full bg-[#0F1115] border border-white/5 shadow-2xl rounded-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-white/5 flex-shrink-0 bg-[#0F1115]">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shadow-lg border border-blue-500/20">
                        <ActivityIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white leading-tight">Activity Log</h2>
                        <p className="text-xs text-slate-500 font-medium">Last 14 Days</p>
                    </div>
                </div>
                <button
                    onClick={() => window.open('/api/cms/activity/export', '_blank')}
                    className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
                    title="Export to CSV"
                >
                    <Download className="h-4 w-4" />
                </button>
            </div>

            <ScrollArea className="flex-1 bg-transparent">
                <div className="relative p-6 space-y-6">
                    {activities.length === 0 ? (
                        <div className="text-sm text-slate-500 text-center py-12 bg-white/5 rounded-xl border border-dashed border-white/5">
                            No recent activity recorded.
                        </div>
                    ) : (
                        <>
                            {/* Vertical Timeline Line */}
                            <div className="absolute left-[43px] top-6 bottom-6 w-[1px] bg-white/5" />

                            <TooltipProvider>
                                {activities.map((activity) => (
                                    <div key={activity.id} className="relative flex gap-4 group">
                                        {/* Avatar / Icon */}
                                        <div className="relative z-10 flex-shrink-0">
                                            {activity.user?.avatar ? (
                                                <img
                                                    src={activity.user.avatar}
                                                    alt={activity.user.name || "User"}
                                                    className="h-10 w-10 rounded-full object-cover border-4 border-slate-900 shadow-sm"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-slate-800 border-4 border-slate-950 ring-1 ring-white/10 flex items-center justify-center shadow-sm">
                                                    <span className="font-bold text-xs text-gray-500">
                                                        {(activity.user?.name?.[0] || "U").toUpperCase()}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Action Indicator Badge */}
                                            <div className={cn(
                                                "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-slate-900 flex items-center justify-center",
                                                getActionColor(activity.action).replace("text-", "bg-").replace("/30", "")
                                            )}>
                                            </div>
                                        </div>

                                        <Tooltip delayDuration={300}>
                                            <TooltipTrigger asChild>
                                                <div className="flex-1 min-w-0 pt-1 cursor-pointer">
                                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                                        <p className="text-sm font-semibold text-gray-200 truncate">
                                                            {activity.user?.name || "Unknown User"}
                                                        </p>
                                                        <span className="text-[10px] text-gray-400 whitespace-nowrap font-medium bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                                                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                                        </span>
                                                    </div>

                                                    <div className="mt-1">
                                                        <p className="text-xs text-gray-400 leading-relaxed group-hover:text-gray-200 transition-colors">
                                                            <span className={cn("inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase mr-1.5", getActionColor(activity.action))}>
                                                                {activity.action}
                                                            </span>
                                                            {activity.resource}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="right" className="p-3 bg-slate-900 text-white border-slate-800 max-w-xs shadow-xl">
                                                <div className="space-y-1">
                                                    <p className="font-semibold text-sm border-b border-slate-700 pb-1 mb-1">
                                                        {activity.action}
                                                    </p>
                                                    <p className="text-xs text-slate-300">
                                                        {activity.details || "No additional details"}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-2 pt-1 border-t border-slate-800">
                                                        {new Date(activity.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                ))}
                            </TooltipProvider>
                        </>
                    )}
                </div>
            </ScrollArea>
        </Card >
    );
}
