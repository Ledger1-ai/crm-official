"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Search, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CRM_MODULES, type CrmModule } from "@/lib/role-permissions";

interface ConfigureModulesModalProps {
    isOpen: boolean;
    onClose: () => void;
    roleName: string;
    enabledModules: string[];
    onSave: (modules: string[]) => void;
    teamId?: string | null;
    userRole?: string | null;
}

// Helper to get all descendant IDs
const getAllChildIds = (module: CrmModule): string[] => {
    if (!module.children) return [];
    return module.children.reduce((acc: string[], child: CrmModule) => {
        return [...acc, child.id, ...getAllChildIds(child)];
    }, [] as string[]);
};

// Recursive Component for Tree Items
const PermissionItem = ({
    module,
    selectedModules,
    onToggle,
    depth = 0,
    searchTerm = ""
}: {
    module: CrmModule;
    selectedModules: string[];
    onToggle: (id: string, allChildIds: string[], checked: boolean) => void;
    depth?: number;
    searchTerm?: string;
}) => {
    const [isExpanded, setIsExpanded] = useState(depth === 0); // Expand top level by default
    const hasChildren = module.children && module.children.length > 0;
    const isSelected = selectedModules.includes(module.id);

    // Filter logic: if search term exists, expand if this item OR children match
    const matchesSearch = module.name.toLowerCase().includes(searchTerm.toLowerCase());

    // Check if any children match the search
    const childrenMatch = useMemo(() => {
        if (!searchTerm) return true;
        const checkChildren = (m: CrmModule): boolean => {
            if (m.name.toLowerCase().includes(searchTerm.toLowerCase())) return true;
            return m.children?.some(checkChildren) || false;
        };
        return module.children?.some(checkChildren) || false;
    }, [module, searchTerm]);

    const allChildIds = useMemo(() => getAllChildIds(module), [module]);

    // Force expand if searching and matches found
    useEffect(() => {
        if (searchTerm && (matchesSearch || childrenMatch)) {
            setIsExpanded(true);
        } else if (!searchTerm) {
            // Restore default (only top level expanded)
            setIsExpanded(depth === 0);
        }
    }, [searchTerm, matchesSearch, childrenMatch, depth]);

    // If searching and neither this nor children match, hide
    if (searchTerm && !matchesSearch && !childrenMatch) return null;

    const handleToggle = (checked: boolean) => {
        onToggle(module.id, allChildIds, checked);
    };

    return (
        <div className="select-none">
            <div
                className={cn(
                    "flex items-center justify-between py-2 px-3 rounded-lg group transition-colors",
                    isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50"
                )}
                style={{ marginLeft: `${depth * 1.5}rem` }}
            >
                <div className="flex items-center gap-2 flex-1 overflow-hidden">
                    {/* Expand Toggle */}
                    {hasChildren ? (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1 hover:bg-muted rounded-md text-muted-foreground transition-colors"
                        >
                            {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            )}
                        </button>
                    ) : (
                        <div className="w-6" /> // Spacer
                    )}

                    {/* Label */}
                    <div className="flex flex-col truncate">
                        <span className={cn(
                            "font-medium text-sm truncate",
                            isSelected ? "text-foreground" : "text-muted-foreground"
                        )}>
                            {module.name}
                        </span>
                        {module.description && (
                            <span className="text-[10px] text-muted-foreground/60 truncate">
                                {module.description}
                            </span>
                        )}
                    </div>
                </div>

                {/* Switch */}
                <Switch
                    checked={isSelected}
                    onCheckedChange={handleToggle}
                    className="ml-4 data-[state=checked]:bg-primary"
                />
            </div>

            {/* Recursion */}
            {hasChildren && isExpanded && (
                <div className="relative mt-1">
                    {/* Visual guide line */}
                    <div
                        className="absolute left-[1.15rem] top-0 bottom-2 w-px bg-border/40"
                        style={{ left: `${(depth * 1.5) + 1.15}rem` }}
                    />
                    {module.children!.map((child) => (
                        <PermissionItem
                            key={child.id}
                            module={child}
                            selectedModules={selectedModules}
                            onToggle={onToggle}
                            depth={depth + 1}
                            searchTerm={searchTerm}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function ConfigureModulesModal({
    isOpen,
    onClose,
    roleName,
    enabledModules,
    onSave,
    teamId,
    userRole
}: ConfigureModulesModalProps) {
    const [selectedModules, setSelectedModules] = useState<string[]>(enabledModules);
    const [searchTerm, setSearchTerm] = useState("");

    // Sync state when modal opens or props change
    useEffect(() => {
        if (isOpen) {
            setSelectedModules(enabledModules);
            setSearchTerm("");
        }
    }, [isOpen, enabledModules]);

    // Smart Toggle Logic
    const handleToggle = (id: string, allChildIds: string[], checked: boolean) => {
        setSelectedModules((prev) => {
            let next = [...prev];

            if (checked) {
                // 1. Add Self
                if (!next.includes(id)) next.push(id);

                // 2. Add All Children (Cascading Select)
                allChildIds.forEach(childId => {
                    if (!next.includes(childId)) next.push(childId);
                });

                // 3. Auto-Check Parents (Upward Propagation)
                const findAndSelectAncestors = (modules: CrmModule[], targetId: string, path: string[]) => {
                    for (const mod of modules) {
                        if (mod.id === targetId) {
                            // Found target, add entire path to selection
                            path.forEach(parentId => {
                                if (!next.includes(parentId)) next.push(parentId);
                            });
                            return true;
                        }
                        if (mod.children) {
                            if (findAndSelectAncestors(mod.children, targetId, [...path, mod.id])) return true;
                        }
                    }
                    return false;
                };

                findAndSelectAncestors(CRM_MODULES, id, []);

            } else {
                // 1. Remove Self
                next = next.filter(m => m !== id);

                // 2. Remove All Children (Cascading Deselect)
                next = next.filter(m => !allChildIds.includes(m));

                // 3. Do NOT auto-deselect parents. 
            }

            return next;
        });
    };

    const handleSelectAll = () => {
        const allIds: string[] = [];
        const traverse = (modules: CrmModule[]) => {
            modules.forEach(m => {
                allIds.push(m.id);
                if (m.children) traverse(m.children);
            });
        };
        traverse(CRM_MODULES);
        setSelectedModules(allIds);
    };

    const handleDeselectAll = () => {
        setSelectedModules([]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-3xl h-[85vh] flex flex-col bg-background/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl">
                {/* Header */}
                <div className="flex flex-col gap-4 p-6 border-b border-border bg-background/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold">Configure Modules for {roleName}</h2>
                            <p className="text-sm text-muted-foreground">
                                Detailed permission control ({selectedModules.length} selected)
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Toolbar */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search permissions (e.g. 'View', 'Export', 'Delete')..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-9 bg-muted/50 border-border/50"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleSelectAll} className="h-9 text-xs">
                                Select All
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleDeselectAll} className="h-9 text-xs">
                                Deselect All
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    {CRM_MODULES.map((module) => (
                        <PermissionItem
                            key={module.id}
                            module={module}
                            selectedModules={selectedModules}
                            onToggle={handleToggle}
                            depth={0}
                            searchTerm={searchTerm}
                        />
                    ))}

                    {/* Empty State for Search */}
                    {selectedModules.length === 0 && searchTerm && (
                        <div className="text-center py-12 text-muted-foreground">
                            No permissions found matching "{searchTerm}"
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-border bg-background/50">
                    <div className="text-xs text-muted-foreground">
                        <span className="font-medium text-amber-500">Note:</span> Unchecking a parent will disable all child permissions.
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button onClick={() => {
                            onSave(selectedModules);
                            onClose();
                        }}>
                            Save Changes
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
