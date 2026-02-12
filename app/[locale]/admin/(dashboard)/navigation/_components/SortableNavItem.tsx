
"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ChevronDown, ChevronRight, Eye, EyeOff, Settings2, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavItem } from "@/lib/navigation-defaults";
import { getIcon } from "../../../../(routes)/components/dynamic-navigation/icon-map";

interface Props {
    item: NavItem;
    depth?: number;
    onEdit?: (item: NavItem) => void;
    onDelete?: (id: string) => void;
    onToggleVisibility?: (id: string) => void;
    onAddChild?: (parentId: string) => void;
}

export function SortableNavItem({
    item,
    depth = 0,
    onEdit,
    onDelete,
    onToggleVisibility,
    onAddChild
}: Props) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        marginLeft: `${depth * 20}px`,
    };

    const iconName = item.iconName;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group relative flex items-center gap-3 p-3 my-1 rounded-xl border transition-all duration-200",
                item.type === "group"
                    ? "bg-primary/5 border-primary/20"
                    : "bg-background/50 border-primary/10 hover:border-primary/30",
                isDragging && "opacity-50 z-50 shadow-2xl scale-[1.02] border-primary bg-primary/10",
                item.hidden && "opacity-60 saturate-50"
            )}
        >
            {/* Drag Handle */}
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-primary transition-colors"
            >
                <GripVertical className="w-4 h-4" />
            </button>

            {/* Icon & Label */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    item.type === "group" ? "bg-primary/20 text-primary" : "bg-primary/5 text-primary/70"
                )}>
                    {iconName ? (
                        React.createElement(getIcon(iconName), { className: "w-4 h-4" })
                    ) : item.type === "group" ? (
                        <ChevronDown className="w-4 h-4" />
                    ) : null}
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold truncate text-primary/90">
                        {item.label}
                    </span>
                    {item.href && (
                        <span className="text-[10px] text-muted-foreground truncate font-mono">
                            {item.href}
                        </span>
                    )}
                </div>
            </div>

            {/* Status Badges */}
            <div className="flex items-center gap-2">
                {item.permissions?.minRole && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase tracking-tighter">
                        {item.permissions.minRole}
                    </span>
                )}
                {item.hidden && <EyeOff className="w-3 h-3 text-red-400" />}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {item.type === "item" && onAddChild && (
                    <button
                        onClick={() => onAddChild(item.id)}
                        className="p-1.5 rounded-md hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                        title="Add Sub-item"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                )}
                <button
                    onClick={() => onEdit?.(item)}
                    className="p-1.5 rounded-md hover:bg-primary/10 text-primary/70 hover:text-primary transition-colors"
                >
                    <Settings2 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onToggleVisibility?.(item.id)}
                    className={cn(
                        "p-1.5 rounded-md transition-colors",
                        item.hidden
                            ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                            : "hover:bg-primary/10 text-primary/70 hover:text-primary"
                    )}
                    title={item.hidden ? "Show in Sidebar" : "Hide in Sidebar"}
                >
                    {item.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                    onClick={() => onDelete?.(item.id)}
                    className="p-1.5 rounded-md hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
