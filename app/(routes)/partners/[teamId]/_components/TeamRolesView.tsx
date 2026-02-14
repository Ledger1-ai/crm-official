"use client";

import React, { useState } from "react";
import { Settings2, Users, Shield, Eye, UserCheck, Plus, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CRM_MODULES, ROLE_CONFIGS } from "@/lib/role-permissions";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface CustomRole {
    id: string;
    name: string;
    description: string | null;
    modules: string[];
    _count: { users: number };
}

interface Props {
    teamId: string;
    roleCounts: {
        owner: number;
        admin: number;
        member: number;
        viewer: number;
    };
    customRoles: CustomRole[];
}

const SYSTEM_ROLES = [
    {
        key: "OWNER",
        name: "Owner",
        description: "Full platform access for this team",
        icon: Shield,
        color: "from-amber-500/20 to-yellow-500/20",
        iconColor: "text-amber-400",
        editable: false,
    },
    {
        key: "ADMIN",
        name: "Admin",
        description: ROLE_CONFIGS.ADMIN.description,
        icon: UserCheck,
        color: "from-blue-500/20 to-indigo-500/20",
        iconColor: "text-blue-400",
        editable: true,
    },
    {
        key: "MEMBER",
        name: "Member",
        description: ROLE_CONFIGS.MEMBER.description,
        icon: Users,
        color: "from-emerald-500/20 to-green-500/20",
        iconColor: "text-emerald-400",
        editable: true,
    },
    {
        key: "VIEWER",
        name: "Viewer",
        description: ROLE_CONFIGS.VIEWER.description,
        icon: Eye,
        color: "from-gray-500/20 to-slate-500/20",
        iconColor: "text-gray-400",
        editable: true,
    },
];

const TeamRolesView = ({ teamId, roleCounts, customRoles }: Props) => {
    const router = useRouter();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<{ key: string; name: string; modules: string[]; isCustom: boolean } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Add role form state
    const [newRoleName, setNewRoleName] = useState("");
    const [newRoleDescription, setNewRoleDescription] = useState("");
    const [newRoleModules, setNewRoleModules] = useState<string[]>([]);

    // Configure modules state
    const [configuredModules, setConfiguredModules] = useState<string[]>([]);

    const getModuleNames = (moduleIds: string[]) => {
        return CRM_MODULES.filter((m) => moduleIds.includes(m.id)).map((m) => m.name);
    };

    const getRoleCount = (key: string) => {
        switch (key) {
            case "OWNER": return roleCounts.owner;
            case "ADMIN": return roleCounts.admin;
            case "MEMBER": return roleCounts.member;
            case "VIEWER": return roleCounts.viewer;
            default: return 0;
        }
    };

    const getRoleModules = (key: string): string[] => {
        if (key === "OWNER") return CRM_MODULES.map((m) => m.id);
        return ROLE_CONFIGS[key as keyof typeof ROLE_CONFIGS]?.defaultModules || [];
    };

    const handleOpenConfigureModal = (roleKey: string, roleName: string, modules: string[], isCustom: boolean) => {
        setSelectedRole({ key: roleKey, name: roleName, modules, isCustom });
        setConfiguredModules([...modules]);
        setIsConfigureModalOpen(true);
    };

    const handleOpenDeleteModal = (roleKey: string, roleName: string) => {
        setSelectedRole({ key: roleKey, name: roleName, modules: [], isCustom: true });
        setIsDeleteModalOpen(true);
    };

    const handleAddRole = async () => {
        if (!newRoleName.trim()) {
            toast.error("Role name is required");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`/api/teams/${teamId}/roles`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newRoleName,
                    description: newRoleDescription,
                    modules: newRoleModules,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create role");
            }

            toast.success("Role created successfully");
            setIsAddModalOpen(false);
            setNewRoleName("");
            setNewRoleDescription("");
            setNewRoleModules([]);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to create role");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveModules = async () => {
        if (!selectedRole) return;

        setIsLoading(true);
        try {
            const endpoint = selectedRole.isCustom
                ? `/api/teams/${teamId}/roles/${selectedRole.key}`
                : `/api/teams/${teamId}/roles/system/${selectedRole.key}`;

            const res = await fetch(endpoint, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ modules: configuredModules }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update modules");
            }

            toast.success("Modules updated successfully");
            setIsConfigureModalOpen(false);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to update modules");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteRole = async () => {
        if (!selectedRole) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/teams/${teamId}/roles/${selectedRole.key}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete role");
            }

            toast.success("Role deleted successfully");
            setIsDeleteModalOpen(false);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete role");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleModule = (moduleId: string, modules: string[], setModules: (m: string[]) => void) => {
        if (modules.includes(moduleId)) {
            setModules(modules.filter((m) => m !== moduleId));
        } else {
            setModules([...modules, moduleId]);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">System Roles</h3>
                <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Custom Role
                </Button>
            </div>

            {/* System Roles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SYSTEM_ROLES.map((role) => {
                    const count = getRoleCount(role.key);
                    const moduleIds = getRoleModules(role.key);
                    const modules = getModuleNames(moduleIds);
                    const Icon = role.icon;

                    return (
                        <Card key={role.key} className="bg-card/50 backdrop-blur-sm border-border/50">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg bg-gradient-to-br ${role.color} ${role.iconColor}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{role.name}</CardTitle>
                                            <CardDescription className="text-xs">{role.description}</CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Users className="w-3.5 h-3.5" />
                                        <span className="text-sm font-medium">{count}</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-3">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Settings2 className="w-3 h-3" />
                                    <span className="font-medium uppercase tracking-wide">
                                        Modules ({modules.length})
                                    </span>
                                </div>
                                {modules.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {modules.slice(0, 5).map((name) => (
                                            <Badge key={name} variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                                                {name}
                                            </Badge>
                                        ))}
                                        {modules.length > 5 && (
                                            <Badge variant="outline" className="text-xs">
                                                +{modules.length - 5} more
                                            </Badge>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground italic">No modules enabled</p>
                                )}
                                {role.editable && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => handleOpenConfigureModal(role.key, role.name, moduleIds, false)}
                                    >
                                        Configure Access
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Custom Roles */}
            {customRoles.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">Custom Roles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {customRoles.map((role) => {
                            const modules = getModuleNames(role.modules);

                            return (
                                <Card key={role.id} className="bg-card/50 backdrop-blur-sm border-border/50">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-400">
                                                    <Shield className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base">{role.name}</CardTitle>
                                                    <CardDescription className="text-xs">
                                                        {role.description || "Custom team role"}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Users className="w-3.5 h-3.5" />
                                                <span className="text-sm font-medium">{role._count.users}</span>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0 space-y-3">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Settings2 className="w-3 h-3" />
                                            <span className="font-medium uppercase tracking-wide">
                                                Modules ({modules.length})
                                            </span>
                                        </div>
                                        {modules.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {modules.slice(0, 5).map((name) => (
                                                    <Badge key={name} variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                                                        {name}
                                                    </Badge>
                                                ))}
                                                {modules.length > 5 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{modules.length - 5} more
                                                    </Badge>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground italic">No modules enabled</p>
                                        )}
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => handleOpenConfigureModal(role.id, role.name, role.modules, true)}
                                            >
                                                Configure Access
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleOpenDeleteModal(role.id, role.name)}
                                            >
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Info */}
            <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                <p className="text-sm text-muted-foreground">
                    <strong>Platform Management:</strong> Configure roles and module access for this partner team.
                    Changes take effect immediately.
                </p>
            </div>

            {/* Add Role Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Custom Role</DialogTitle>
                        <DialogDescription>Create a new role with specific module access.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium">Role Name</label>
                            <Input
                                placeholder="e.g., Sales Rep"
                                value={newRoleName}
                                onChange={(e) => setNewRoleName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Description</label>
                            <Textarea
                                placeholder="Short description of this role..."
                                value={newRoleDescription}
                                onChange={(e) => setNewRoleDescription(e.target.value)}
                                rows={2}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Module Access</label>
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                                {CRM_MODULES.map((mod) => (
                                    <div key={mod.id} className="flex items-center gap-2">
                                        <Checkbox
                                            id={`new-${mod.id}`}
                                            checked={newRoleModules.includes(mod.id)}
                                            onCheckedChange={() => toggleModule(mod.id, newRoleModules, setNewRoleModules)}
                                        />
                                        <label htmlFor={`new-${mod.id}`} className="text-sm cursor-pointer">
                                            {mod.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddRole} disabled={isLoading}>
                            {isLoading ? "Creating..." : "Create Role"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Configure Modules Modal */}
            <Dialog open={isConfigureModalOpen} onOpenChange={setIsConfigureModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Configure Access: {selectedRole?.name}</DialogTitle>
                        <DialogDescription>Select which modules this role can access.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                            {CRM_MODULES.map((mod) => (
                                <div key={mod.id} className="flex items-center gap-2">
                                    <Checkbox
                                        id={`config-${mod.id}`}
                                        checked={configuredModules.includes(mod.id)}
                                        onCheckedChange={() => toggleModule(mod.id, configuredModules, setConfiguredModules)}
                                    />
                                    <label htmlFor={`config-${mod.id}`} className="text-sm cursor-pointer">
                                        {mod.name}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfigureModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveModules} disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Role Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete Role</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the "{selectedRole?.name}" role? Users with this role will be moved to the default Member role.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteRole} disabled={isLoading}>
                            {isLoading ? "Deleting..." : "Delete Role"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TeamRolesView;

