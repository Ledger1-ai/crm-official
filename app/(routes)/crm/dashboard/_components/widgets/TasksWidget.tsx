"use client";

import React, { useState, useTransition } from "react";
import { WidgetWrapper } from "./WidgetWrapper";
import { CheckCircle2, Clock, ArrowRight, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { markTaskComplete } from "@/actions/dashboard/mark-task-complete";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { priorities } from "@/app/(routes)/campaigns/tasks/data/data";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import NewTaskDialog from "@/app/(routes)/campaigns/dialogs/NewTask";
import UpdateTaskDialog from "@/app/(routes)/campaigns/dialogs/UpdateTask";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import axios from "axios";

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

    const [selectedTask, setSelectedTask] = useState<any | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isLoadingTask, setIsLoadingTask] = useState(false);

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

    const handleTaskClick = async (taskId: string) => {
        setIsLoadingTask(true);
        setIsEditOpen(true);
        try {
            const res = await axios.get(`/api/campaigns/tasks/${taskId}`);
            setSelectedTask(res.data);
        } catch (error) {
            toast.error("Failed to load task details");
            setIsEditOpen(false);
        } finally {
            setIsLoadingTask(false);
        }
    };

    const filteredTasks = tasks.filter(task => {
        return task.title.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const getPriorityData = (p: string) => {
        return priorities.find((item) => item.value === p.toLowerCase()) || null;
    };

    const { data: teamData } = useSWR(searchTerm === "" ? "/api/team/members" : null, fetcher);
    const { data: projectsData } = useSWR(searchTerm === "" ? "/api/campaigns" : null, fetcher);

    const users = teamData?.members || [];
    const boards = projectsData?.projects || [];

    const rightAction = (
        <NewTaskDialog
            users={users}
            boards={boards}
            customTrigger={
                <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[10px] font-bold border-white/10 bg-white/5 hover:bg-white/10"
                >
                    <Plus size={12} className="mr-1" />
                    TASK
                </Button>
            }
        />
    );

    return (
        <>
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-2xl h-[90vh] flex flex-col p-4">
                    <DialogHeader>
                        <DialogTitle>Edit Task</DialogTitle>
                    </DialogHeader>
                    {isLoadingTask ? (
                        <div className="flex items-center justify-center flex-1 h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : selectedTask ? (
                        <UpdateTaskDialog
                            users={users}
                            boards={boards}
                            boardId={selectedTask.assigned_section?.board || selectedTask.assigned_section?.boardId}
                            initialData={selectedTask}
                            onDone={() => {
                                setIsEditOpen(false);
                                router.refresh();
                            }}
                        />
                    ) : (
                        <div className="flex items-center justify-center flex-1 text-muted-foreground">
                            Failed to load task
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <WidgetWrapper
                title="Active Tasks"
                icon={CheckCircle2}
                iconColor="text-emerald-400"
                onSearch={setSearchTerm}
                searchValue={searchTerm}
                footerHref={`/campaigns/tasks/${userId}`}
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
                                        <span className="text-sm font-semibold text-white/90 truncate group-hover:text-primary transition-colors cursor-pointer" onClick={() => handleTaskClick(task.id)}>
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
                                        <Link href={`/campaigns/boards/${task.assigned_section.board}`}>
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
        </>
    );
};

