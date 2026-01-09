"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CRM_MODULES } from "@/lib/role-permissions";
import { cn } from "@/lib/utils";
import { Loader2, Plus } from "lucide-react";

interface AddRoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    teamId: string;
}

export function AddRoleModal({ isOpen, onClose, teamId }: AddRoleModalProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedModules, setSelectedModules] = useState<string[]>([]);

    const handleModuleToggle = (moduleId: string) => {
        setSelectedModules((prev) =>
            prev.includes(moduleId)
                ? prev.filter((m) => m !== moduleId)
                : [...prev, moduleId]
        );
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error("Role name is required");
            return;
        }

        startTransition(async () => {
            try {
                await axios.post("/api/roles", {
                    name: name.trim(),
                    description: description.trim() || undefined,
                    modules: selectedModules,
                    teamId,
                });

                toast.success(`Role "${name}" created successfully!`);
                router.refresh();
                handleClose();
            } catch (error: any) {
                const message = error.response?.data?.error || "Failed to create role";
                toast.error(message);
            }
        });
    };

    const handleClose = () => {
        setName("");
        setDescription("");
        setSelectedModules([]);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Create New Role</DialogTitle>
                    <DialogDescription>
                        Define a custom role with specific module access for your team.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Role Name */}
                    <div className="space-y-2">
                        <Label htmlFor="role-name">Role Name</Label>
                        <Input
                            id="role-name"
                            placeholder="e.g., Sales Representative"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-background"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="role-desc">Description (Optional)</Label>
                        <Textarea
                            id="role-desc"
                            placeholder="Brief description of this role..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-background resize-none"
                            rows={2}
                        />
                    </div>

                    {/* Module Selection */}
                    <div className="space-y-3">
                        <Label>Module Access</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {CRM_MODULES.map((module) => (
                                <div
                                    key={module.id}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer",
                                        selectedModules.includes(module.id)
                                            ? "bg-primary/10 border-primary/30"
                                            : "bg-muted/20 border-border/50 hover:bg-muted/40"
                                    )}
                                    onClick={() => handleModuleToggle(module.id)}
                                >
                                    <span className="text-sm font-medium">{module.name}</span>
                                    <Switch
                                        checked={selectedModules.includes(module.id)}
                                        onCheckedChange={() => handleModuleToggle(module.id)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={handleClose} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isPending}>
                        {isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Role
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
