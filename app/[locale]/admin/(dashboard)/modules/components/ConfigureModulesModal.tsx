"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { CRM_MODULES, type CrmModule } from "@/lib/role-permissions";

interface ConfigureModulesModalProps {
    isOpen: boolean;
    onClose: () => void;
    roleName: string;
    enabledModules: string[];
    onSave: (modules: string[]) => void;
}

export default function ConfigureModulesModal({
    isOpen,
    onClose,
    roleName,
    enabledModules,
    onSave,
}: ConfigureModulesModalProps) {
    const [selectedModules, setSelectedModules] = useState<string[]>(enabledModules);

    if (!isOpen) return null;

    const handleToggle = (moduleId: string) => {
        setSelectedModules((prev) =>
            prev.includes(moduleId)
                ? prev.filter((id) => id !== moduleId)
                : [...prev, moduleId]
        );
    };

    const handleSave = () => {
        onSave(selectedModules);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-2xl mx-4 bg-background/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h2 className="text-xl font-semibold">Configure Modules for {roleName}</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Toggle which sections of the CRM this role can access.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modules Grid */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {CRM_MODULES.map((module) => (
                            <ModuleToggleRow
                                key={module.id}
                                module={module}
                                isEnabled={selectedModules.includes(module.id)}
                                onToggle={() => handleToggle(module.id)}
                            />
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
}

interface ModuleToggleRowProps {
    module: CrmModule;
    isEnabled: boolean;
    onToggle: () => void;
}

function ModuleToggleRow({ module, isEnabled, onToggle }: ModuleToggleRowProps) {
    return (
        <div
            className={cn(
                "flex items-center justify-between p-4 rounded-lg border transition-colors",
                isEnabled
                    ? "bg-primary/10 border-primary/30"
                    : "bg-muted/30 border-border"
            )}
        >
            <div className="flex items-center gap-3">
                <div className={cn(
                    "w-8 h-8 rounded-md flex items-center justify-center text-sm font-semibold",
                    isEnabled ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}>
                    {module.name.slice(0, 2).toUpperCase()}
                </div>
                <span className={cn(
                    "font-medium",
                    isEnabled ? "text-foreground" : "text-muted-foreground"
                )}>
                    {module.name}
                </span>
            </div>
            <Switch
                checked={isEnabled}
                onCheckedChange={onToggle}
            />
        </div>
    );
}
