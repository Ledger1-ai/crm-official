"use client";

import { Draggable } from "@hello-pangea/dnd";
import { Check, EyeIcon, Pencil, TrashIcon, AlertTriangle, Calendar, Undo2 } from "lucide-react";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import moment from "moment";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React from "react";
import { priorities } from "../../../tasks/data/data";

interface Task {
    id: string;
    title: string;
    content?: string;
    priority?: string;
    dueDateAt?: string | Date;
    taskStatus?: string;
    assigned_user?: {
        id: string;
        name: string;
        avatar?: string;
    };
    section: string;
}

interface KanbanCardProps {
    task: Task;
    index: number;
    onView: (task: Task) => void;
    onEdit: (task: Task) => void;
    onDelete: (task: Task) => void;
    onDone: (task: Task) => void;
    onUndo: (task: Task) => void;
}

interface KanbanCardContentProps {
    task: Task;
    isDragging?: boolean;
    provided?: any;
    onView: (task: Task) => void;
    onEdit: (task: Task) => void;
    onDelete: (task: Task) => void;
    onDone: (task: Task) => void;
    onUndo: (task: Task) => void;
    style?: React.CSSProperties;
    dragHandleProps?: any;
}

export function KanbanCardContent({
    task,
    isDragging,
    provided,
    onView,
    onEdit,
    onDelete,
    onDone,
    onUndo,
    style,
    dragHandleProps
}: KanbanCardContentProps) {
    const isOverdue =
        task.dueDateAt &&
        task.taskStatus !== "COMPLETE" &&
        // eslint-disable-next-line react-hooks/purity
        new Date(task.dueDateAt).getTime() < Date.now();

    const isComplete = task.taskStatus === "COMPLETE";

    const priority = (task.priority || "normal").toLowerCase();

    const priorityItem = priorities.find(p => p.value === priority);
    const priorityColor = priorityItem?.color && priorityItem?.bgColor
        ? `${priorityItem.bgColor} ${priorityItem.color} border-${priorityItem.color.split('-')[1]}-200`
        : "bg-yellow-100 text-yellow-700 border-yellow-200";

    return (
        <div
            ref={provided?.innerRef}
            {...provided?.draggableProps}
            {...dragHandleProps}
            className={cn(
                "group relative flex flex-col gap-2 p-3 mb-3 rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md",
                isDragging && "shadow-lg rotate-2 scale-105 z-50 ring-2 ring-primary/20",
                isComplete && "opacity-60 bg-muted/50"
            )}
            style={style || provided?.draggableProps.style}
            onDoubleClick={() => {
                if (!isComplete) {
                    onEdit(task);
                }
            }}
        >
            {/* Header: Title and Actions */}
            <div className="flex justify-between items-start gap-2">
                <h3 className={cn("font-semibold text-sm leading-tight line-clamp-2", isComplete && "line-through text-muted-foreground")}>
                    {task.title || "Untitled Task"}
                </h3>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded-md -mr-1 -mt-1">
                            <DotsHorizontalIcon className="w-4 h-4 text-muted-foreground" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => onView(task)}>
                            <EyeIcon className="w-4 h-4 mr-2 opacity-70" />
                            View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(task)}>
                            <Pencil className="w-4 h-4 mr-2 opacity-70" />
                            Edit
                        </DropdownMenuItem>
                        {!isComplete ? (
                            <DropdownMenuItem onClick={() => onDone(task)}>
                                <Check className="w-4 h-4 mr-2 opacity-70" />
                                Mark as Done
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem onClick={() => onUndo(task)}>
                                <Undo2 className="w-4 h-4 mr-2 opacity-70 text-emerald-600" />
                                Mark as Active
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onDelete(task)} className="text-destructive focus:text-destructive">
                            <TrashIcon className="w-4 h-4 mr-2 opacity-70" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Content Preview */}
            {task.content && (
                <p className="text-xs text-muted-foreground line-clamp-2">{task.content}</p>
            )}

            {/* Footer: Meta info */}
            <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-2">
                    {/* Priority Badge */}
                    {task.priority && (
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 border-0 font-medium", priorityColor)}>
                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </Badge>
                    )}

                    {/* Due Date */}
                    {task.dueDateAt && (
                        <div className={cn(
                            "flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md border",
                            isOverdue ? "bg-red-50 text-red-600 border-red-200" : "bg-muted/50 text-muted-foreground border-transparent"
                        )}>
                            {isOverdue ? <AlertTriangle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                            <span>{moment(task.dueDateAt).format("MMM D")}</span>
                        </div>
                    )}
                </div>

                {/* Assignee Avatar */}
                {task.assigned_user && (
                    <HoverCard>
                        <HoverCardTrigger>
                            <Avatar className="h-6 w-6 border-2 border-background">
                                <AvatarImage src={task.assigned_user.avatar} />
                                <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                    {task.assigned_user.name?.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-auto p-2 text-xs">
                            Assigned to <span className="font-semibold">{task.assigned_user.name}</span>
                        </HoverCardContent>
                    </HoverCard>
                )}
            </div>
        </div>
    );
}

export default function KanbanCard(props: KanbanCardProps) {
    return (
        <Draggable draggableId={props.task.id} index={props.index}>
            {(provided, snapshot) => (
                <KanbanCardContent
                    {...props}
                    provided={provided}
                    isDragging={snapshot.isDragging}
                    dragHandleProps={provided.dragHandleProps}
                />
            )}
        </Draggable>
    );
}
