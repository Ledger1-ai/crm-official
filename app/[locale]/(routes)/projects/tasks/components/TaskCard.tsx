"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MoreHorizontal, Calendar, User, Flag, CheckCircle } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { statuses, priorities } from "../data/data";
import { cn } from "@/lib/utils";
import moment from "moment";
import Link from "next/link";

type TaskCardProps = {
    task: {
        id: string;
        title: string;
        dueDateAt: string;
        assigned_user?: { name: string } | null;
        taskStatus: string;
        priority: string;
        content?: string;
    };
};

export default function TaskCard({ task }: TaskCardProps) {
    const status = statuses.find((s) => s.value === task.taskStatus);
    const priority = priorities.find((p) => p.value === task.priority);

    return (
        <Card className="w-full">
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{task.title}</h3>
                        {task.content && (
                            <Badge variant="outline" className="mt-1 text-[10px]">
                                {task.content}
                            </Badge>
                        )}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={`/projects/tasks/viewtask/${task.id}`}>View Task</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={`/projects/tasks/viewtask/${task.id}?edit=true`}>Edit</Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    {/* Due Date */}
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{moment(task.dueDateAt).format("MMM D, YYYY")}</span>
                    </div>
                    {/* Assigned User */}
                    <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        <span className="truncate">{task.assigned_user?.name || "Unassigned"}</span>
                    </div>
                </div>

                {/* Status and Priority */}
                <div className="flex flex-wrap gap-2 pt-1">
                    {status && (
                        <Badge variant="secondary" className={cn("text-[10px] gap-1 border-0 shadow-none", status.bgColor, status.color)}>
                            {status.icon && <status.icon className="h-3 w-3" />}
                            {status.label}
                        </Badge>
                    )}
                    {priority && (
                        <Badge variant="outline" className={cn("text-[10px] gap-1.5 border-0 shadow-none", priority.bgColor, priority.color)}>
                            <div className={cn("h-1.5 w-1.5 rounded-full", priority.dotColor)} />
                            {priority.label}
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
