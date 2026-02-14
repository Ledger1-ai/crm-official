
"use client";

import React, { useState, useTransition } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { toast } from "react-hot-toast";
import { Save, RotateCcw, Plus, Layout, ListTree, Monitor } from "lucide-react";

import { NavItem, DEFAULT_NAV_STRUCTURE } from "@/lib/navigation-defaults";
import { SortableNavItem } from "./SortableNavItem";
import { NavItemDialog } from "./NavItemDialog";
import { updateTeamNavigationConfig, updateUserNavigationConfig, resetNavigationConfig } from "@/actions/navigation/update-navigation-config";
import DynamicModuleMenu from "../../../../(routes)/components/dynamic-navigation/DynamicModuleMenu";
import { cn } from "@/lib/utils";

interface Props {
    initialStructure: NavItem[];
    modules: any;
    dict: any;
    features: string[];
    isPartnerAdmin: boolean;
    teamRole: string;
}

export function NavigationEditor({
    initialStructure,
    modules,
    dict,
    features,
    isPartnerAdmin,
    teamRole
}: Props) {
    const [structure, setStructure] = useState<NavItem[]>(initialStructure || DEFAULT_NAV_STRUCTURE);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
    const [scope, setScope] = useState<"USER" | "TEAM">("TEAM");

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<NavItem | null>(null);
    const [activeParentId, setActiveParentId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // ─── Tree Helpers ───
    const findAndReplace = (items: NavItem[], id: string, newData: NavItem): NavItem[] => {
        return items.map(item => {
            if (item.id === id) return { ...item, ...newData };
            if (item.children) return { ...item, children: findAndReplace(item.children, id, newData) };
            return item;
        });
    };

    const findAndDelete = (items: NavItem[], id: string): NavItem[] => {
        return items
            .filter(item => item.id !== id)
            .map(item => ({
                ...item,
                children: item.children ? findAndDelete(item.children, id) : undefined
            }));
    };

    const findAndAddChild = (items: NavItem[], parentId: string, newItem: NavItem): NavItem[] => {
        return items.map(item => {
            if (item.id === parentId) {
                return {
                    ...item,
                    children: [...(item.children || []), newItem]
                };
            }
            if (item.children) {
                return {
                    ...item,
                    children: findAndAddChild(item.children, parentId, newItem)
                };
            }
            return item;
        });
    };

    // ─── Actions ───
    const handleEdit = (item: NavItem) => {
        setEditingItem(item);
        setActiveParentId(null);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (!confirm("Are you sure you want to remove this item?")) return;
        setStructure(prev => findAndDelete(prev, id));
        toast.success("Item removed locally");
    };

    const handleToggleVisibility = (id: string) => {
        const toggleVisibilityInTree = (items: NavItem[]): NavItem[] => {
            return items.map(item => {
                if (item.id === id) {
                    return { ...item, hidden: !item.hidden };
                }
                if (item.children) {
                    return { ...item, children: toggleVisibilityInTree(item.children) };
                }
                return item;
            });
        };
        setStructure(prev => toggleVisibilityInTree(prev));
    };

    const handleAddChild = (parentId: string) => {
        setEditingItem(null);
        setActiveParentId(parentId);
        setIsDialogOpen(true);
    };

    const handleAddNewSection = () => {
        setEditingItem(null);
        setActiveParentId(null);
        setIsDialogOpen(true);
    };

    const onDialogSave = (data: NavItem) => {
        if (editingItem) {
            // Update
            setStructure(prev => findAndReplace(prev, editingItem.id, data));
            toast.success("Item updated");
        } else if (activeParentId) {
            // Add Child
            const newItem = { ...data, id: `nav_${Math.random().toString(36).substr(2, 9)}` };
            setStructure(prev => findAndAddChild(prev, activeParentId, newItem));
            toast.success("Sub-item added");
        } else {
            // Add Root
            const newItem = { ...data, id: `nav_${Math.random().toString(36).substr(2, 9)}` };
            setStructure(prev => [...prev, newItem]);
            toast.success("New section added");
        }
        setIsDialogOpen(false);
    };

    const handleSave = () => {
        startTransition(async () => {
            try {
                if (scope === "TEAM") {
                    await updateTeamNavigationConfig(structure);
                } else {
                    await updateUserNavigationConfig(structure);
                }
                toast.success(`Navigation saved for ${scope.toLowerCase()}`);
            } catch (error: any) {
                toast.error(error.message || "Failed to save");
            }
        });
    };

    const handleReset = () => {
        if (!confirm(`Are you sure you want to reset the ${scope} navigation to default?`)) return;
        startTransition(async () => {
            try {
                await resetNavigationConfig(scope);
                setStructure(DEFAULT_NAV_STRUCTURE);
                toast.success(`${scope} navigation reset`);
            } catch (error: any) {
                toast.error("Failed to reset");
            }
        });
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setStructure((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
        setActiveId(null);
    };

    // ─── Render ───
    return (
        <div className="flex flex-col gap-6 h-full font-sans">
            {/* Header bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#18181b]/50 border border-primary/20 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
                        <Layout className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Navigation Manager</h1>
                        <p className="text-xs text-muted-foreground">Customize sidebar categories and items</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* View Toggle */}
                    <div className="flex bg-primary/5 rounded-lg p-1 mr-4">
                        <button
                            onClick={() => setViewMode("edit")}
                            className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2", viewMode === "edit" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-white")}
                        >
                            <ListTree className="w-3.5 h-3.5" /> Editor
                        </button>
                        <button
                            onClick={() => setViewMode("preview")}
                            className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2", viewMode === "preview" ? "bg-primary text-primary-foreground shadow-lg" : "text-primary/60 hover:text-primary")}
                        >
                            <Monitor className="w-3.5 h-3.5" /> Live Preview
                        </button>
                    </div>

                    {/* Scope Selector */}
                    {isPartnerAdmin && (
                        <select
                            value={scope}
                            onChange={(e) => setScope(e.target.value as any)}
                            className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 text-xs text-primary/80 focus:outline-none focus:ring-2 ring-primary/50"
                        >
                            <option value="TEAM" className="bg-[#18181b]">Team Default</option>
                            <option value="USER" className="bg-[#18181b]">My Personal Override</option>
                        </select>
                    )}

                    <button
                        onClick={handleReset}
                        disabled={isPending}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/5 hover:bg-red-500/10 text-primary/70 hover:text-red-400 border border-primary/20 transition-all text-xs font-bold"
                    >
                        <RotateCcw className="w-4 h-4" /> Reset
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={isPending}
                        className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all text-sm font-bold disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" /> {isPending ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0 flex gap-6 overflow-hidden">
                {/* Main Editor Area */}
                <div className={cn(
                    "flex-1 overflow-y-auto p-2 custom-scrollbar transition-all duration-300",
                    viewMode === "preview" && "opacity-0 scale-95 pointer-events-none"
                )}>
                    <div className="max-w-3xl mx-auto space-y-4 pb-20">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={structure.map((i) => i.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {structure.map((item) => (
                                    <div key={item.id} className="space-y-1">
                                        <SortableNavItem
                                            item={item}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            onToggleVisibility={handleToggleVisibility}
                                            onAddChild={handleAddChild}
                                        />

                                        {/* Render children - Simple flat list for reordering subs */}
                                        {item.children?.map(child => (
                                            <SortableNavItem
                                                key={child.id}
                                                item={child}
                                                depth={1}
                                                onEdit={handleEdit}
                                                onDelete={handleDelete}
                                                onToggleVisibility={handleToggleVisibility}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </SortableContext>

                            <DragOverlay>
                                {activeId ? (
                                    <div className="w-full opacity-80 backdrop-blur-md">
                                        <SortableNavItem item={structure.find(i => i.id === activeId) || structure.flatMap(i => i.children || []).find(c => c.id === activeId)!} />
                                    </div>
                                ) : null}
                            </DragOverlay>
                        </DndContext>

                        <button
                            onClick={handleAddNewSection}
                            className="w-full py-4 rounded-xl border-2 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 text-primary/60 hover:text-primary transition-all flex items-center justify-center gap-2 text-sm font-bold"
                        >
                            <Plus className="w-4 h-4" /> Add New Section
                        </button>
                    </div>
                </div>

                {/* NavItem Dialog */}
                <NavItemDialog
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    onSave={onDialogSave}
                    item={editingItem}
                />

                {/* Live Preview Persistent Sidebar */}
                {viewMode === "preview" && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-10 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="relative w-full max-w-5xl h-full bg-[#18181b] rounded-3xl border border-primary/20 shadow-2xl overflow-hidden flex">
                            {/* Inside the preview container, we render our sidebar component */}
                            <div className="w-[12.5rem] bg-background border-r border-primary/10">
                                <DynamicModuleMenu
                                    navStructure={structure}
                                    modules={modules}
                                    dict={dict}
                                    features={features}
                                    isPartnerAdmin={isPartnerAdmin}
                                    teamRole={teamRole}
                                />
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                                <Monitor className="w-20 h-20 text-primary/20 mb-6" />
                                <h2 className="text-2xl font-bold text-white mb-2">Live Sidebar Preview</h2>
                                <p className="text-muted-foreground max-w-md">
                                    This is how your sidebar will look to users on your team.
                                    Switch back to the editor to make more changes.
                                </p>
                                <button
                                    onClick={() => setViewMode("edit")}
                                    className="mt-8 px-6 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold transition-all"
                                >
                                    Close Preview
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
