"use client";

import React, { useState, useTransition } from "react";
import { WidgetWrapper } from "./WidgetWrapper";
import { CheckCircle2, Clock, ArrowRight, Plus } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { markTaskComplete } from "@/actions/dashboard/mark-task-complete";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { priorities } from "@/app/(routes)/projects/tasks/data/data";
import { cn } from "@/lib/utils";

interface DailyTask {
    id: string;
    title: string;
    priority: string;
    dueDateAt: Date | null;
    taskStatus: string | null;
    assigned_section: {
        board: string | null;
        title: string | null;
    } | null;
}

interface TasksWidgetProps {
    tasks: DailyTask[];
    userId: string;
}

export const TasksWidget = ({ tasks: initialTasks, userId }: TasksWidgetProps) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [tasks, setTasks] = useState<DailyTask[]>(initialTasks);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    // Update local state when prop changes (if server revalidates)
    React.useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    const handleTaskComplete = async (taskId: string) => {
        // Optimistic update
        const previousTasks = [...tasks];
        setTasks(prev => prev.filter(t => t.id !== taskId));

        startTransition(async () => {
            try {
                const result = await markTaskComplete(taskId);
                if (result.success) {
                    toast.success("Task completed");
                    router.refresh();
                } else {
                    // Revert if failed
                    setTasks(previousTasks);
                    toast.error("Failed to complete task");
                }
            } catch (error) {
                setTasks(previousTasks);
                toast.error("Something went wrong");
            }
        });
    };

    const filteredTasks = tasks.filter(task => {
        return task.title.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const getPriorityData = (p: string) => {
        return priorities.find((item) => item.value === p.toLowerCase()) || null;
    };

    const rightAction = (
        <Link href="/campaigns/tasks">
            <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-[10px] font-bold border-white/10 bg-white/5 hover:bg-white/10"
            >
                <Plus size={12} className="mr-1.5" />
                TASK
            </Button>
        </Link>
    );

    return (
        <WidgetWrapper
            title="Active Tasks"
            icon={CheckCircle2}
            iconColor="text-emerald-400"
            onSearch={setSearchTerm}
            searchValue={searchTerm}
            footerHref={`/projects/tasks/${userId}`}
            footerLabel="View All Tasks"
            count={tasks.length}
            rightAction={rightAction}
        >
            <div className="space-y-1 pb-4 mt-2">
                {filteredTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground/30">
                        <CheckCircle2 className="h-10 w-10 mb-2 opacity-10" />
                        <p className="text-[11px] font-medium italic">No active tasks found</p>
                    </div>
                ) : (
                    filteredTasks.map((task) => (
                        <div
                            key={task.id}
                            className="group flex items-start justify-between gap-3 p-3 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/[0.03] transition-all duration-300"
                        >
                            <div className="pt-0.5">
                                <Checkbox
                                    checked={false}
                                    onCheckedChange={() => handleTaskComplete(task.id)}
                                    className="border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                                />
                            </div>
                            <div className="space-y-1.5 overflow-hidden flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-white/90 truncate group-hover:text-primary transition-colors cursor-pointer" onClick={() => handleTaskComplete(task.id)}>
                                        {task.title}
                                    </span>
                                    {(() => {
                                        const pData = getPriorityData(task.priority);
                                        return (
                                            <Badge variant="outline" className={cn("text-[8px] h-4 px-1.5 capitalize border-0 shadow-none", pData?.bgColor, pData?.color)}>
                                                {pData?.dotColor && <div className={cn("h-1.5 w-1.5 rounded-full mr-0.5", pData.dotColor)} />}
                                                {task.priority}
                                            </Badge>
                                        );
                                    })()}
                                </div>

                                <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium">
                                    {task.dueDateAt && (
                                        <span className={new Date(task.dueDateAt) < new Date() ? "text-destructive font-bold" : "flex items-center gap-1 opacity-70"}>
                                            <Clock size={10} />
                                            {format(new Date(task.dueDateAt), "MMM d")}
                                        </span>
                                    )}
                                    {task.assigned_section?.title && (
                                        <span className="flex items-center gap-1.5 truncate">
                                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                            {task.assigned_section.title}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="shrink-0 pt-1">
                                {task.assigned_section?.board && (
                                    <Link href={`/projects/boards/${task.assigned_section.board}`}>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 bg-white/5 hover:bg-primary hover:text-white transition-all duration-300"
                                        >
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </WidgetWrapper>
    );
};
