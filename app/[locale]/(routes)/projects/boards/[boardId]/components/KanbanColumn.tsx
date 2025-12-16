"use client";

import { Draggable, Droppable } from "@hello-pangea/dnd";
import { PlusIcon, TrashIcon, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import KanbanCard from "./KanbanCard";

interface Task {
    id: string;
    title: string;
    section: string;
    [key: string]: any;
}

interface Section {
    id: string;
    title: string;
    tasks: Task[];
}

interface KanbanColumnProps {
    section: Section;
    index: number;
    onUpdateTitle: (e: React.ChangeEvent<HTMLInputElement>, id: string) => void;
    onDeleteSection: (id: string) => void;
    onCreateTask: (sectionId: string) => void;
    onViewTask: (task: Task) => void;
    onEditTask: (task: Task) => void;
    onDeleteTask: (task: Task) => void;
    onDoneTask: (task: Task) => void;
}

export default function KanbanColumn({
    section,
    index,
    onUpdateTitle,
    onDeleteSection,
    onCreateTask,
    onViewTask,
    onEditTask,
    onDeleteTask,
    onDoneTask,
}: KanbanColumnProps) {
    return (
        <div className="flex flex-col h-full w-80 min-w-[320px] bg-muted/20 rounded-xl border shadow-sm backdrop-blur-sm snap-center">
            {/* Column Header */}
            <div className="p-3 flex items-center justify-between gap-2 border-b bg-background/50 rounded-t-xl">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input
                        type="text"
                        className="bg-transparent font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 rounded px-1 w-full truncate"
                        value={section.title}
                        onChange={(e) => onUpdateTitle(e, section.id)}
                        placeholder="Section Name"
                    />
                    <Badge variant="secondary" className="px-1.5 py-0 h-5 text-[10px] font-medium">
                        {section.tasks?.length || 0}
                    </Badge>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onDeleteSection(section.id)} className="text-destructive focus:text-destructive">
                            <TrashIcon className="w-4 h-4 mr-2" />
                            Delete Section
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Task List */}
            <Droppable droppableId={section.id} isDropDisabled={false} isCombineEnabled={false}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                            "flex-1 overflow-y-auto p-2 transition-colors scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent",
                            snapshot.isDraggingOver ? "bg-primary/5" : ""
                        )}
                    >
                        <div className="flex flex-col gap-0.5">
                            {section.tasks?.map((task, taskIndex) => (
                                <KanbanCard
                                    key={task.id}
                                    task={task}
                                    index={taskIndex}
                                    onView={onViewTask}
                                    onEdit={onEditTask}
                                    onDelete={onDeleteTask}
                                    onDone={onDoneTask}
                                />
                            ))}
                            {provided.placeholder}
                        </div>

                        {/* Empty State / Quick Add Area */}
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-background/50 mt-2 h-9 text-sm font-normal"
                            onClick={() => onCreateTask(section.id)}
                        >
                            <PlusIcon className="w-4 h-4 mr-2" />
                            Add Task
                        </Button>
                    </div>
                )}
            </Droppable>
        </div>
    );
}
