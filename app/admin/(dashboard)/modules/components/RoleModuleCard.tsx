"use client";

import { useState } from "react";
import { Users, Settings2, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CRM_MODULES, type CrmModule } from "@/lib/role-permissions";
import { toast } from "sonner";
import { DeleteRoleModal } from "./DeleteRoleModal";
import ConfigureModulesModal from "./ConfigureModulesModal";


interface RoleModuleCardProps {
    roleName: string;
    roleKey: string;
    description: string;
    userCount?: number;
    enabledModules: string[];
    isCustom?: boolean;
    badge?: string;
    onModulesChange?: (roleKey: string, modules: string[]) => void;
    onUpdate?: (modules: string[]) => Promise<any>;
}

export default function RoleModuleCard({
    roleName,
    roleKey,
    description,
    userCount,
    enabledModules,
    isCustom = false,
    badge,
    onModulesChange,
    onUpdate,
}: RoleModuleCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [modules, setModules] = useState<string[]>(enabledModules);

    const handleSave = async (newModules: string[]) => {
        setModules(newModules);

        if (onUpdate) {
            const promise = onUpdate(newModules);
            toast.promise(promise, {
                loading: "Updating permissions...",
                success: "Permissions updated successfully",
                error: "Failed to update permissions"
            });
        }

        onModulesChange?.(roleKey, newModules);
    };

    // Helper to get display pills (Parent + Count)
    const getDisplayPills = () => {
        const pills: { name: string, count: number, isPartial: boolean }[] = [];

        CRM_MODULES.forEach(parent => {
            // Check if parent (or any of its children) is involved
            const allChildIds = getAllChildIds(parent);
            const parentAndChildren = [parent.id, ...allChildIds];

            // How many selected in this entire tree?
            const selectedInTree = parentAndChildren.filter(id => modules.includes(id));
            const selectedCount = selectedInTree.length;

            if (selectedCount > 0) {
                // Logic:
                // 1. If EVERYTHING in the tree is selected -> Show "Parent" (clean)
                // 2. If PARTIAL -> Show "Parent (+N)" where N is the count of specific selected items (excluding the parent ID itself for clarity?)
                //    Actually, usually "Parent" implies base access. 

                const isFullySelected = selectedCount === parentAndChildren.length;

                // For the count badge, we usually want to show how many *sub-features* are enabled.
                // So we count distinct selected descendants.
                const selectedDescendants = allChildIds.filter(id => modules.includes(id)).length;

                pills.push({
                    name: parent.name,
                    count: !isFullySelected ? selectedDescendants : 0,
                    isPartial: !isFullySelected
                });
            }
        });

        return pills;
    };

    const pills = getDisplayPills();

    return (
        <>
            <div className="flex flex-col bg-card/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors group relative h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-border/50">
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-lg font-semibold">{roleName}</h3>
                            {badge && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500/30 text-amber-500 bg-amber-500/5">
                                    {badge}
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                    </div>
                    {userCount !== undefined && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span className="text-sm font-medium">{userCount}</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Settings2 className="w-4 h-4" />
                        <span className="font-medium uppercase tracking-wide text-xs">
                            Access Level ({modules.length} permissions)
                        </span>
                    </div>

                    {pills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {pills.map((pill) => (
                                <Badge
                                    key={pill.name}
                                    variant="secondary"
                                    className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 flex gap-1"
                                >
                                    {pill.name}
                                    {pill.count > 0 && <span className="opacity-70 text-xs">+{pill.count}</span>}
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">
                            No modules enabled
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border/50 space-y-2 mt-auto">
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setIsModalOpen(true)}
                    >
                        Configure Access
                    </Button>

                    {isCustom && (
                        <Button
                            variant="ghost"
                            className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setIsDeleteModalOpen(true)}
                        >
                            <Trash className="w-4 h-4 mr-2" />
                            Delete Role
                        </Button>
                    )}
                </div>
            </div >

            <ConfigureModulesModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                roleName={roleName}
                enabledModules={modules}
                onSave={handleSave}
            />

            <DeleteRoleModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                roleId={roleKey}
                roleName={roleName}
            />
        </>
    );
}

// Helper to get all descendant IDs
const getAllChildIds = (module: CrmModule): string[] => {
    if (!module.children) return [];
    return module.children.reduce((acc: string[], child: CrmModule) => {
        return [...acc, child.id, ...getAllChildIds(child)];
    }, [] as string[]);
};
