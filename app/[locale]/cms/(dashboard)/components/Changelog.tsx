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
    };
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
        if (lower.includes("create") || lower.includes("add") || lower.includes("upload") || lower.includes("invite")) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
        if (lower.includes("update") || lower.includes("edit") || lower.includes("modify")) return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
        if (lower.includes("delete") || lower.includes("remove")) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
        return "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-400";
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
        <Card className="h-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm rounded-xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-800 flex-shrink-0 bg-gray-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <ActivityIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Activity Log</h2>
                        <p className="text-xs text-gray-500 font-medium">Last 14 Days</p>
                    </div>
                </div>
                <button
                    onClick={() => window.open('/api/cms/activity/export', '_blank')}
                    className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Export to CSV"
                >
                    <Download className="h-4 w-4" />
                </button>
            </div>

            <ScrollArea className="flex-1 bg-white dark:bg-slate-900">
                <div className="relative p-6 space-y-6">
                    {activities.length === 0 ? (
                        <div className="text-sm text-gray-500 text-center py-12 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                            No recent activity recorded.
                        </div>
                    ) : (
                        <>
                            {/* Vertical Timeline Line - Centered on Avatar (w-10 = 40px -> center 20px) + Padding (24px) = 44px */}
                            <div className="absolute left-[43px] top-6 bottom-6 w-[2px] bg-gray-100 dark:bg-slate-800" />

                            <TooltipProvider>
                                {activities.map((activity) => (
                                    <div key={activity.id} className="relative flex gap-4 group">
                                        {/* Avatar / Icon */}
                                        <div className="relative z-10 flex-shrink-0">
                                            {activity.user.avatar ? (
                                                <img
                                                    src={activity.user.avatar}
                                                    alt={activity.user.name || "User"}
                                                    className="h-10 w-10 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-sm"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-white dark:bg-slate-900 border-4 border-white dark:border-slate-900 ring-1 ring-gray-100 dark:ring-slate-800 flex items-center justify-center shadow-sm">
                                                    <span className="font-bold text-xs text-gray-500">
                                                        {(activity.user.name?.[0] || "U").toUpperCase()}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Action Indicator Badge */}
                                            <div className={cn(
                                                "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center",
                                                getActionColor(activity.action).replace("text-", "bg-").replace("/30", "")
                                            )}>
                                            </div>
                                        </div>

                                        <Tooltip delayDuration={300}>
                                            <TooltipTrigger asChild>
                                                <div className="flex-1 min-w-0 pt-1 cursor-pointer">
                                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                            {activity.user.name || "Unknown User"}
                                                        </p>
                                                        <span className="text-[10px] text-gray-400 whitespace-nowrap font-medium bg-gray-50 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-gray-100 dark:border-slate-700">
                                                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                                        </span>
                                                    </div>

                                                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                                                        <span className={cn("inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase mr-1.5", getActionColor(activity.action))}>
                                                            {activity.action}
                                                        </span>
                                                        {activity.resource}
                                                    </p>
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
        </Card>
    );
}
