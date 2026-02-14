"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, EyeOff, Eye } from "lucide-react";
import { useDashboardLayout } from "../../_context/DashboardLayoutContext";
import { cn } from "@/lib/utils";

interface SortableWidgetProps {
    id: string;
    children: React.ReactNode;
    disabled?: boolean;
    className?: string;
}

export function SortableWidget({ id, children, disabled, className }: SortableWidgetProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : "auto",
        position: "relative" as "relative",
    };

    const { isEditMode, toggleWidgetVisibility, widgets } = useDashboardLayout();
    const widget = widgets.find(w => w.id === id);
    const isVisible = widget?.isVisible ?? true;

    return (
        <div ref={setNodeRef} style={style} className={cn("relative group/sortable h-full", className)}>
            {isEditMode && (
                <div className="absolute top-2 right-2 z-50 flex items-center gap-2 bg-black/60 rounded-md p-1 backdrop-blur-sm border border-white/10">
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // prevent drag
                            toggleWidgetVisibility(id, !isVisible);
                        }}
                        className="p-1 hover:bg-white/10 rounded cursor-pointer text-white/70 hover:text-white transition-colors"
                        title={isVisible ? "Hide widget" : "Show widget"}
                    >
                        {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <div
                        {...attributes}
                        {...listeners}
                        className="p-1 hover:bg-white/10 rounded cursor-grab active:cursor-grabbing text-white/70 hover:text-white transition-colors"
                    >
                        <GripVertical size={14} />
                    </div>
                </div>
            )}
            <div className={cn("h-full transition-all duration-300", !isVisible && isEditMode && "opacity-40 grayscale border border-dashed border-white/20 rounded-xl overflow-hidden")}>
                {children}
            </div>
        </div>
    );
}
