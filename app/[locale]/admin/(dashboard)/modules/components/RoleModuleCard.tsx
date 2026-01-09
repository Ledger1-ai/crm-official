"use client";

import { useState } from "react";
import { Users, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CRM_MODULES } from "@/lib/role-permissions";
import ConfigureModulesModal from "./ConfigureModulesModal";

interface RoleModuleCardProps {
    roleName: string;
    roleKey: string;
    description: string;
    userCount: number;
    enabledModules: string[];
    isCustom?: boolean;
    onModulesChange?: (roleKey: string, modules: string[]) => void;
}

export default function RoleModuleCard({
    roleName,
    roleKey,
    description,
    userCount,
    enabledModules,
    isCustom = false,
    onModulesChange,
}: RoleModuleCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modules, setModules] = useState<string[]>(enabledModules);

    const handleSave = (newModules: string[]) => {
        setModules(newModules);
        onModulesChange?.(roleKey, newModules);
    };

    // Get module display names for pills
    const enabledModuleNames = CRM_MODULES
        .filter(m => modules.includes(m.id))
        .map(m => m.name);

    return (
        <>
            <div className="flex flex-col bg-card/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-border/50">
                    <div>
                        <h3 className="text-lg font-semibold">{roleName}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span className="text-sm font-medium">{userCount}</span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Settings2 className="w-4 h-4" />
                        <span className="font-medium uppercase tracking-wide text-xs">
                            Enabled Modules ({modules.length})
                        </span>
                    </div>

                    {modules.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {enabledModuleNames.map((name) => (
                                <Badge
                                    key={name}
                                    variant="secondary"
                                    className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                                >
                                    {name}
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
                <div className="p-4 border-t border-border/50">
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setIsModalOpen(true)}
                    >
                        Configure Access
                    </Button>
                </div>
            </div>

            <ConfigureModulesModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                roleName={roleName}
                enabledModules={modules}
                onSave={handleSave}
            />
        </>
    );
}
