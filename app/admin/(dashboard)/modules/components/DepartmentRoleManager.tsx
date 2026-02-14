"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import RoleModuleCard from "./RoleModuleCard";
import { updateRoleModules } from "@/actions/permissions/update-role-modules";
import { createDepartment } from "@/actions/departments/create-department";
import { updateDepartment } from "@/actions/departments/update-department"; // Assuming this exists
import { deleteDepartment } from "@/actions/departments/delete-department";
import { cn } from "@/lib/utils";
import { Building2, Inbox, Plus, Pencil, Loader2, Trash2 } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OrgData {
    adminModules: string[];
    memberModules: string[];
    viewerModules: string[];
    adminCount: number;
    memberCount: number;
    viewerCount: number;
}

interface DepartmentData {
    id: string;
    name: string;
    slug: string;
    adminModules: string[];
    memberModules: string[];
    viewerModules: string[];
    adminCount: number;
    memberCount: number;
    viewerCount: number;
}

interface DepartmentRoleManagerProps {
    teamId: string; // Parent Organization ID required for creating departments
    departments: DepartmentData[];
    orgData: OrgData;
}

export default function DepartmentRoleManager({ teamId, departments, orgData }: DepartmentRoleManagerProps) {
    const router = useRouter();
    // Default to 'organization' tab
    const [selectedTabId, setSelectedTabId] = useState<string>("organization");

    // Create/Edit State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [newDeptName, setNewDeptName] = useState("");
    const [editDeptId, setEditDeptId] = useState("");
    const [editDeptName, setEditDeptName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const selectedDept = departments.find(d => d.id === selectedTabId);
    const isOrgSelected = selectedTabId === "organization";

    // Initial Empty State (if no departments exist)
    // Note: I need to update the initial render check if needed, but Org always exists so it's fine.

    // Handlers
    async function handleCreateDepartment() {
        if (!newDeptName.trim()) {
            toast.error("Please enter a department name");
            return;
        }
        setIsLoading(true);
        try {
            const result = await createDepartment({
                name: newDeptName,
                parentId: teamId
            });

            if (result.success) {
                toast.success("Department created successfully");
                setShowCreateModal(false);
                setNewDeptName("");
                router.refresh();
                // Select the new department if possible (might need effect or just wait for refresh)
                if (result.department) {
                    setSelectedTabId(result.department.id);
                }
            } else {
                toast.error(result.error || "Failed to create department");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleEditDepartment() {
        if (!editDeptName.trim()) {
            toast.error("Please enter a department name");
            return;
        }
        setIsLoading(true);
        try {
            const result = await updateDepartment({
                departmentId: editDeptId,
                name: editDeptName
            });

            if (result.success) {
                toast.success("Department updated successfully");
                setShowEditModal(false);
                router.refresh();
            } else {
                toast.error(result.error || "Failed to update department");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleDeleteDepartment() {
        setIsLoading(true);
        try {
            const result = await deleteDepartment(editDeptId);

            if (result.success) {
                toast.success("Department deleted successfully");
                setShowDeleteConfirm(false);
                setShowEditModal(false);
                // If the deleted department was selected, select the first available one or clear selection
                const remainingDepts = departments.filter(d => d.id !== editDeptId);
                if (remainingDepts.length > 0) {
                    setSelectedTabId(remainingDepts[0].id);
                } else {
                    setSelectedTabId("organization"); // Default to organization if no departments left
                }
                router.refresh();
            } else {
                toast.error(result.error || "Failed to delete department");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    }

    function openEditModal(dept: DepartmentData) {
        setEditDeptId(dept.id);
        setEditDeptName(dept.name);
        setShowEditModal(true);
        setShowDeleteConfirm(false);
    }

    // Modal Renders
    function renderCreateModal() {
        return (
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Department</DialogTitle>
                        <DialogDescription>Create a new department to organize your team.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-dept-name">Department Name</Label>
                            <Input
                                id="new-dept-name"
                                placeholder="e.g., Sales, Marketing"
                                value={newDeptName}
                                onChange={(e) => setNewDeptName(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                        <Button onClick={handleCreateDepartment} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Department
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    function renderEditModal() {
        return (
            <Dialog open={showEditModal} onOpenChange={(open) => {
                if (!open) setShowDeleteConfirm(false);
                setShowEditModal(open);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Department</DialogTitle>
                        <DialogDescription>Update department details or remove it.</DialogDescription>
                    </DialogHeader>

                    {!showDeleteConfirm ? (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-dept-name">Department Name</Label>
                                <Input
                                    id="edit-dept-name"
                                    value={editDeptName}
                                    onChange={(e) => setEditDeptName(e.target.value)}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="py-6 space-y-3 text-center animate-in fade-in zoom-in-95 duration-200">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center mx-auto mb-2">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <h4 className="text-lg font-semibold">Delete {editDeptName}?</h4>
                            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                This will remove the department and unassign all its members. This action cannot be undone.
                            </p>
                        </div>
                    )}

                    <DialogFooter className={cn("gap-2 sm:gap-0", !showDeleteConfirm && "justify-between sm:justify-between")}>
                        {!showDeleteConfirm ? (
                            <>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="mr-auto"
                                    onClick={() => setShowDeleteConfirm(true)}
                                >
                                    Delete
                                </Button>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
                                    <Button onClick={handleEditDepartment} disabled={isLoading}>
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Changes
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Button variant="outline" className="w-full sm:w-auto" onClick={() => setShowDeleteConfirm(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="w-full sm:w-auto"
                                    onClick={handleDeleteDepartment}
                                    disabled={isLoading}
                                >
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Confirm Delete
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-6 border-b pb-4 flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        Department Configurations
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Select a department to configure its access levels.
                    </p>
                </div>
            </div>

            {/* Pill Tabs & Actions */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
                {departments.map((dept) => {
                    const totalMembers = dept.adminCount + dept.memberCount + (dept.viewerCount || 0); // Include viewers if added later
                    return (
                        <button
                            key={dept.id}
                            onClick={() => setSelectedTabId(dept.id)}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 border group",
                                selectedTabId === dept.id
                                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                                    : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
                            )}
                        >
                            {dept.name}

                            {/* Member Count Pill - Hidden if 0 */}
                            {totalMembers > 0 && (
                                <span className={cn(
                                    "text-xs px-1.5 py-0.5 rounded-full transition-colors",
                                    selectedTabId === dept.id
                                        ? "bg-primary-foreground/20 text-primary-foreground"
                                        : "bg-background text-muted-foreground"
                                )}>
                                    {totalMembers}
                                </span>
                            )}

                            {/* Edit Button (Visible on Hover/Selected) */}
                            <div
                                role="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openEditModal(dept);
                                }}
                                className={cn(
                                    "ml-1 p-1 rounded-full hover:bg-black/20 transition-opacity",
                                    selectedTabId === dept.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                )}
                            >
                                <Pencil className="w-3 h-3" />
                            </div>
                        </button>
                    );
                })}

                {/* Create Department Pill Button */}
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 border border-dashed border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary"
                >
                    <Plus className="w-4 h-4" />
                    New Department
                </button>
            </div>

            {/* Selected Department Content */}
            {selectedDept && (
                <div className="p-6 bg-muted/20 rounded-xl border border-primary/20 animate-in fade-in slide-in-from-bottom-2 duration-300 relative">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium flex items-center gap-2">
                            {selectedDept.name} Roles
                            <span className="text-xs text-muted-foreground font-normal px-2 py-0.5 bg-background rounded-full border">
                                {selectedDept.slug}
                            </span>
                        </h4>
                        {/* 'modules active' badge removed as requested */}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <RoleModuleCard
                            roleName={`${selectedDept.name} Admin`}
                            roleKey="ADMIN"
                            description={`Admins within the ${selectedDept.name} department.`}
                            userCount={selectedDept.adminCount}
                            enabledModules={selectedDept.adminModules}
                            onUpdate={updateRoleModules.bind(null, selectedDept.id, 'ADMIN', 'DEPARTMENT')}
                        />
                        <RoleModuleCard
                            roleName={`${selectedDept.name} Member`}
                            roleKey="MEMBER"
                            description={`Members within the ${selectedDept.name} department.`}
                            userCount={selectedDept.memberCount}
                            enabledModules={selectedDept.memberModules}
                            onUpdate={updateRoleModules.bind(null, selectedDept.id, 'MEMBER', 'DEPARTMENT')}
                        />
                        <RoleModuleCard
                            roleName={`${selectedDept.name} Viewer`}
                            roleKey="VIEWER"
                            description={`Viewers within the ${selectedDept.name} department.`}
                            userCount={selectedDept.viewerCount}
                            enabledModules={selectedDept.viewerModules}
                            onUpdate={updateRoleModules.bind(null, selectedDept.id, 'VIEWER', 'DEPARTMENT')}
                        />
                    </div>
                </div>
            )}

            {renderCreateModal()}
            {renderEditModal()}
        </div>
    );
}
