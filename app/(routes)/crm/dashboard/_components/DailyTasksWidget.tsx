"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CheckCircle2, Clock, CalendarIcon, ArrowRight } from "lucide-react";
import DashboardCard from "./DashboardCard";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface DailyTasksWidgetProps {
    tasks: DailyTask[];
}

export default function DailyTasksWidget({ tasks }: DailyTasksWidgetProps) {
    const [open, setOpen] = useState(false);

    const priorityColor = (p: string) => {
        switch (p.toLowerCase()) {
            case "high": return "destructive"; // or red
            case "medium": return "default"; // or yellow/orange
            case "low": return "secondary"; // or blue/gray
            default: return "outline";
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <DashboardCard
                    icon={CalendarIcon}
                    label="Daily Tasks"
                    count={tasks.length}
                    description={tasks.length > 0 ? "Approaching deadlines" : "No tasks due today"}
                    primaryColor="text-emerald-500"
                    className="w-full"
                />
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Todays Agenda
                    </DialogTitle>
                    <DialogDescription>
                        {tasks.length > 0
                            ? `You have ${tasks.length} task${tasks.length === 1 ? '' : 's'} due today or overdue.`
                            : "You're all caught up! No tasks due today."}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] mt-4 pr-4">
                    <div className="space-y-3">
                        {tasks.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground opacity-60">
                                <CheckCircle2 className="h-12 w-12 mb-3" />
                                <p>No tasks for today</p>
                            </div>
                        )}

                        {tasks.map((task) => (
                            <div key={task.id} className="group flex items-start justify-between gap-3 p-3 rounded-lg border bg-card/50 hover:bg-muted/50 transition-colors">
                                <div className="space-y-1.5 overflow-hidden">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium truncate block">{task.title}</span>
                                        <Badge variant={priorityColor(task.priority) as any} className="text-[10px] h-5 px-1.5 capitalize">
                                            {task.priority}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        {task.dueDateAt && (
                                            <span className={new Date(task.dueDateAt) < new Date() ? "text-destructive font-medium" : ""}>
                                                Due: {format(new Date(task.dueDateAt), "MMM d")}
                                            </span>
                                        )}
                                        {task.assigned_section?.title && (
                                            <span className="flex items-center gap-1">
                                                <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                                {task.assigned_section.title}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="shrink-0 pt-0.5">
                                    {task.assigned_section?.board ? (
                                        <Link href={`/campaigns/boards/${task.assigned_section.board}`}>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
