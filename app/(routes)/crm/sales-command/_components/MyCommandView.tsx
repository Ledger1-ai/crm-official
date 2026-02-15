"use client";

import React, { useState } from "react";
import { useSalesCommand } from "./SalesCommandProvider";
import { UnifiedMetricCard } from "./UnifiedMetricCard";
import { UnifiedStageBar } from "./UnifiedStageBar";
import { motion } from "framer-motion";
import NewTaskDialog from "./NewTaskDialog";
import { format } from "date-fns";
import Link from "next/link";
import { CheckCircle2, Clock, AlertCircle, Circle } from "lucide-react";

const priorityColors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-green-500/20 text-green-400 border-green-500/30",
};

const statusIcons: Record<string, React.ReactNode> = {
    DONE: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    BACKLOG: <Circle className="h-4 w-4 text-muted-foreground" />,
    TODO: <Clock className="h-4 w-4 text-blue-400" />,
    "IN PROGRESS": <AlertCircle className="h-4 w-4 text-amber-400" />,
};

export default function MyCommandView() {
    const { data, selectedUserData, crmData, boards, tasks } = useSalesCommand();
    const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

    // Use drilled-down data if available, otherwise fallback to own data
    const activeData = selectedUserData ? {
        myPipeline: selectedUserData.pipeline,
        myScore: selectedUserData.score,
        myRank: selectedUserData.rank,
        name: selectedUserData.meta.userName
    } : {
        ...data.userData,
        name: "My"
    };

    // Filter tasks that are not done and sort by priority/due date
    const activeTasks = tasks
        .filter((task: any) => task.taskStatus !== "DONE")
        .slice(0, 5); // Show top 5 tasks

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            {/* Left Column: Pipeline Health */}
            <div className="lg:col-span-4 space-y-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-xl border bg-card p-6 shadow-sm h-full"
                >
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold tracking-tight">{activeData.name === "My" ? "My Pipeline" : `${activeData.name}'s Pipeline`}</h2>
                        <p className="text-sm text-muted-foreground">Real-time status of active leads.</p>
                    </div>
                    <UnifiedStageBar
                        stages={activeData.myPipeline.counts as any}
                        total={activeData.myPipeline.total}
                        orientation="vertical"
                        height={500}
                        className="w-full"
                    />
                </motion.div>
            </div>

            {/* Middle Column: Tasks & Actions */}
            <div className="lg:col-span-5 space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-xl border bg-card p-6 shadow-sm min-h-[400px]"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight">Priority Actions</h2>
                            <p className="text-sm text-muted-foreground">Focus on these tasks today.</p>
                        </div>
                        <button
                            onClick={() => setIsTaskDialogOpen(true)}
                            className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full hover:opacity-90 transition"
                        >
                            + New Task
                        </button>
                    </div>

                    {activeTasks.length > 0 ? (
                        <div className="space-y-3">
                            {activeTasks.map((task: any) => (
                                <Link
                                    key={task.id}
                                    href={`/campaigns/tasks/viewtask/${task.id}`}
                                    className="block"
                                >
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5">
                                                {statusIcons[task.taskStatus] || <Circle className="h-4 w-4 text-muted-foreground" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-sm truncate">{task.title}</span>
                                                    {task.priority && (
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${priorityColors[task.priority] || priorityColors.low}`}>
                                                            {task.priority.toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    {task.dueDateAt && (
                                                        <span>Due: {format(new Date(task.dueDateAt), "MMM d")}</span>
                                                    )}
                                                    {task.assigned_user?.name && (
                                                        <span>• {task.assigned_user.name}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                            {tasks.length > 5 && (
                                <Link href="/campaigns/tasks" className="block text-center text-xs text-primary hover:underline py-2">
                                    View all {tasks.length} tasks →
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[300px] text-center border-2 border-dashed rounded-lg bg-muted/20">
                            <div className="text-muted-foreground text-sm">No urgent tasks pending.</div>
                            <div className="text-xs text-muted-foreground mt-1">Great job clearing your queue!</div>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Right Column: Performance & Rank */}
            <div className="lg:col-span-3 space-y-4">
                <UnifiedMetricCard
                    title="Revenue Score"
                    value={activeData.myScore * 100} // Placeholder calculation for revenue derived from score/points
                    subtitle="Estimated value closed"
                    iconName="DollarSign"
                    accentColor="emerald"
                    delay={0.2}
                />
                <UnifiedMetricCard
                    title="Team Rank"
                    value={`#${activeData.myRank ?? "-"}`}
                    subtitle={`Top ${activeData.myRank && activeData.myRank <= 3 ? "Performer" : "Contender"}`}
                    iconName="TrendingUp"
                    accentColor="violet"
                    delay={0.3}
                />
                <UnifiedMetricCard
                    title="Pipeline Value"
                    value={activeData.myPipeline.total}
                    subtitle="Active Deals"
                    iconName="Target"
                    accentColor="cyan"
                    delay={0.4}
                />
            </div>

            {/* New Task Dialog */}
            <NewTaskDialog
                users={crmData?.users || []}
                boards={boards || []}
                open={isTaskDialogOpen}
                setOpen={setIsTaskDialogOpen}
            />
        </div>
    );
}

