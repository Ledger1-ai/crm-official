"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import { Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CRM_MODULES } from "@/lib/role-permissions";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface DepartmentOption {
    id: string;
    name: string;
}

interface AddRoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    teamId: string; // The main Org ID
    departments: DepartmentOption[];
}

export function AddRoleModal({ isOpen, onClose, teamId, departments }: AddRoleModalProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedModules, setSelectedModules] = useState<string[]>([]);

    // Scope state: 'org' means Global (teamId), otherwise it's a specific Department ID
    const [selectedScopeId, setSelectedScopeId] = useState<string>("org");

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

        const targetTeamId = selectedScopeId === "org" ? teamId : selectedScopeId;

        startTransition(async () => {
            try {
                // Ensure the target team (department or org) is passed
                await axios.post("/api/roles", {
                    name: name.trim(),
                    description: description.trim() || undefined,
                    modules: selectedModules,
                    teamId: targetTeamId,
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
        setSelectedScopeId("org");
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                        {/* Scope Selector */}
                        <div className="space-y-2">
                            <Label htmlFor="role-scope">Scope (Department)</Label>
                            <Select value={selectedScopeId} onValueChange={setSelectedScopeId}>
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Select Scope" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="org">Organization (Global)</SelectItem>
                                    {departments.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
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
