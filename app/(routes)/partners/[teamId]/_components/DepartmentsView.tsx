"use client";

import React, { useState, useEffect } from "react";
import { Building2, Plus, Users, Settings2, Trash2, Edit2, UserPlus, LayoutGrid, List, Table as TableIcon, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { createDepartment } from "@/actions/departments/create-department";
import { deleteDepartment } from "@/actions/departments/delete-department";
import { updateDepartment } from "@/actions/departments/update-department";
import { AddDepartmentMemberModal } from "./AddDepartmentMemberModal";
import { ViewDepartmentMembersModal } from "./ViewDepartmentMembersModal";

interface Department {
    id: string;
    name: string;
    slug: string;
    _count: { members: number };
    members: Array<{
        id: string;
        name: string | null;
        email: string;
        team_role: string | null;
        avatar?: string | null;
    }>;
}

interface Props {
    teamId: string;
    departments: Department[];
    isSuperAdmin: boolean;
}

export function DepartmentsView({ teamId, departments: initialDepartments, isSuperAdmin }: Props) {
    const router = useRouter();
    const [departments, setDepartments] = useState<Department[]>(initialDepartments);
    const [deptForAdd, setDeptForAdd] = useState<Department | null>(null);
    const [deptForView, setDeptForView] = useState<Department | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "list" | "table">("grid");

    useEffect(() => {
        setDepartments(initialDepartments);
    }, [initialDepartments]);

    // Form state
    const [newDeptName, setNewDeptName] = useState("");
    const [editDeptName, setEditDeptName] = useState("");

    const getAdminCount = (dept: Department) =>
        dept.members.filter((m) => m.team_role === "ADMIN" || m.team_role === "SUPER_ADMIN").length;

    const getMemberCount = (dept: Department) =>
        dept.members.filter((m) => m.team_role === "MEMBER").length;

    const handleCreateDepartment = async () => {
        if (!newDeptName.trim()) {
            toast.error("Please enter a department name");
            return;
        }

        setIsLoading(true);
        try {
            const result = await createDepartment({
                name: newDeptName.trim(),
                parentId: teamId
            });
            if (result.success && result.department) {
                toast.success(`Department "${result.department.name}" created`);
                setShowCreateModal(false);
                setNewDeptName("");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to create department");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditDepartment = async () => {
        if (!selectedDepartment || !editDeptName.trim()) {
            toast.error("Please enter a department name");
            return;
        }

        setIsLoading(true);
        try {
            const result = await updateDepartment({
                departmentId: selectedDepartment.id,
                name: editDeptName.trim(),
            });
            if (result.success) {
                toast.success("Department updated");
                setShowEditModal(false);
                setSelectedDepartment(null);
                setEditDeptName("");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to update department");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteDepartment = async () => {
        if (!selectedDepartment) return;

        setIsLoading(true);
        try {
            const result = await deleteDepartment(selectedDepartment.id);
            if (result.success) {
                toast.success("Department deleted");
                setShowDeleteModal(false);
                setSelectedDepartment(null);
                router.refresh();
            } else {
                toast.error(result.error || "Failed to delete department");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const openEditModal = (dept: Department) => {
        setSelectedDepartment(dept);
        setEditDeptName(dept.name);
        setShowEditModal(true);
    };

    const openDeleteModal = (dept: Department) => {
        setSelectedDepartment(dept);
        setShowDeleteModal(true);
    };

    const ActionsMenu = ({ dept }: { dept: Department }) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings2 className="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setDeptForView(dept)}>
                    <Users className="w-4 h-4 mr-2" />
                    View Members
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/${window.location.pathname.split('/')[1]}/admin/modules`)}>
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Manage Roles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openEditModal(dept)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeptForAdd(dept)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Members
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => openDeleteModal(dept)}
                    className="text-destructive focus:text-destructive"
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Departments</h2>
                    <p className="text-muted-foreground">
                        Organize your team into departments for scoped access control
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center p-1 bg-muted/50 rounded-lg border">
                        <Button
                            variant={viewMode === "grid" ? "secondary" : "ghost"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewMode("grid")}
                            title="Grid View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={viewMode === "list" ? "secondary" : "ghost"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewMode("list")}
                            title="List View"
                        >
                            <List className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={viewMode === "table" ? "secondary" : "ghost"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewMode("table")}
                            title="Table View"
                        >
                            <TableIcon className="w-4 h-4" />
                        </Button>
                    </div>

                    {isSuperAdmin && (
                        <Button onClick={() => setShowCreateModal(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Department
                        </Button>
                    )}
                </div>
            </div>

            {/* Department Grid */}
            {departments.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                    <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No Departments Yet</h3>
                    <p className="text-muted-foreground mb-4">
                        Create departments to organize your team and control access
                    </p>
                    {isSuperAdmin && (
                        <Button onClick={() => setShowCreateModal(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create First Department
                        </Button>
                    )}
                </div>
            ) : (
                <>
                    {/* Grid View */}
                    {viewMode === "grid" && (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {departments.map((dept) => (
                                <Card
                                    key={dept.id}
                                    className="group relative overflow-hidden border p-6 transition-all duration-300 hover:shadow-lg hover:border-primary/30"
                                >
                                    {/* Gradient Background */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20">
                                                    <Building2 className="w-5 h-5 text-blue-400" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                                        {dept.name}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground font-mono">
                                                        {dept.slug}
                                                    </p>
                                                </div>
                                            </div>
                                            {isSuperAdmin && <ActionsMenu dept={dept} />}
                                        </div>
                                        {/* Stats */}
                                        <div className="mt-4 flex items-center gap-4 text-sm">
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Users className="w-4 h-4" />
                                                <span>{dept._count?.members || 0} members</span>
                                            </div>
                                            {getAdminCount(dept) > 0 && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {getAdminCount(dept)} admin{getAdminCount(dept) !== 1 ? "s" : ""}
                                                </Badge>
                                            )}
                                        </div>
                                        {/* Member Preview */}
                                        {dept.members.length > 0 && (
                                            <div className="mt-4 flex -space-x-2">
                                                {dept.members.slice(0, 5).map((member) => (
                                                    <div
                                                        key={member.id}
                                                        className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-medium"
                                                        title={member.name || member.email}
                                                    >
                                                        {(member.name || member.email)[0].toUpperCase()}
                                                    </div>
                                                ))}
                                                {dept.members.length > 5 && (
                                                    <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground">
                                                        +{dept.members.length - 5}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* List View */}
                    {viewMode === "list" && (
                        <div className="space-y-3">
                            {departments.map((dept) => (
                                <Card key={dept.id} className="p-4 flex items-center justify-between group hover:border-primary/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Building2 className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium">{dept.name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Badge variant="outline" className="text-xs font-normal">{dept.slug}</Badge>
                                                <span>•</span>
                                                <Users className="w-3 h-3" />
                                                <span>{dept._count?.members || 0} members</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="hidden md:flex -space-x-2">
                                            {dept.members.slice(0, 5).map((member) => (
                                                <div key={member.id} className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-medium" title={member.name || member.email}>
                                                    {(member.name || member.email)[0].toUpperCase()}
                                                </div>
                                            ))}
                                            {dept.members.length > 5 && <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs text-muted-foreground">+{dept.members.length - 5}</div>}
                                        </div>
                                        {isSuperAdmin && <ActionsMenu dept={dept} />}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Table View */}
                    {viewMode === "table" && (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Slug</TableHead>
                                        <TableHead>Members</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {departments.map((dept) => (
                                        <TableRow key={dept.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Building2 className="w-4 h-4 text-muted-foreground" />
                                                    <span className="font-medium">{dept.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-mono text-xs">{dept.slug}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-3 h-3 text-muted-foreground" />
                                                    <span>{dept._count?.members || 0}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {isSuperAdmin && <ActionsMenu dept={dept} />}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </>
            )}

            {/* Create Department Modal */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Department</DialogTitle>
                        <DialogDescription>
                            Create a new department to organize your team members and control access
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="dept-name">Department Name</Label>
                            <Input
                                id="dept-name"
                                placeholder="e.g., Sales, Marketing, DevOps"
                                value={newDeptName}
                                onChange={(e) => setNewDeptName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleCreateDepartment()}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateDepartment} disabled={isLoading}>
                            {isLoading ? "Creating..." : "Create Department"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Department Modal */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Department</DialogTitle>
                        <DialogDescription>
                            Update the department name
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-dept-name">Department Name</Label>
                            <Input
                                id="edit-dept-name"
                                value={editDeptName}
                                onChange={(e) => setEditDeptName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleEditDepartment()}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleEditDepartment} disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Department</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{selectedDepartment?.name}</strong>?
                            Members will be moved back to the organization level.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteDepartment}
                            disabled={isLoading}
                        >
                            {isLoading ? "Deleting..." : "Delete Department"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Add Member Modal */}
            {deptForAdd && (
                <AddDepartmentMemberModal
                    isOpen={!!deptForAdd}
                    onClose={() => setDeptForAdd(null)}
                    departmentId={deptForAdd.id}
                    departmentName={deptForAdd.name}
                    organizationId={teamId}
                />
            )}
            {/* View Members Modal */}
            {deptForView && (
                <ViewDepartmentMembersModal
                    isOpen={!!deptForView}
                    onClose={() => setDeptForView(null)}
                    departmentName={deptForView.name}
                    members={deptForView.members}
                    isSuperAdmin={isSuperAdmin}
                />
            )}

        </div>
    );
}

export default DepartmentsView;
