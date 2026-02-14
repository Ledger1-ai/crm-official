"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { assignToDepartment, AssignToDepartmentInput } from "@/actions/departments/assign-to-department";
import { Loader2, Building2 } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { TeamRole, ALL_ROLES } from "@/lib/role-permissions";

interface Department {
    id: string;
    name: string;
}

interface AssignDepartmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
    currentDepartmentId?: string | null;
    currentRole?: TeamRole;
    departments: Department[];
}

export default function AssignDepartmentModal({
    isOpen,
    onClose,
    userId,
    userName,
    currentDepartmentId,
    currentRole,
    departments
}: AssignDepartmentModalProps) {
    const router = useRouter();
    const [selectedDeptId, setSelectedDeptId] = useState<string>(currentDepartmentId || "none");
    const [selectedRole, setSelectedRole] = useState<TeamRole>(currentRole || "MEMBER");
    const [isLoading, setIsLoading] = useState(false);

    async function handleAssign() {
        setIsLoading(true);
        try {
            const departmentId = selectedDeptId === "none" ? null : selectedDeptId;

            const input: AssignToDepartmentInput = {
                userId,
                departmentId,
                role: selectedRole,
            };

            const result = await assignToDepartment(input);

            if (result.success) {
                toast.success(departmentId ? "User assigned to department" : "User removed from department");
                router.refresh(); // Refresh to update list
                onClose();
            } else {
                toast.error(result.error || "Failed to assign department");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px] bg-[#0A0A0A] border-amber-500/20">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-amber-500" />
                        Assign Department
                    </DialogTitle>
                    <DialogDescription>
                        Assign <strong>{userName}</strong> to a specific department.
                        They will inherit permissions scoped to that department.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="department">Department</Label>
                        <Select
                            value={selectedDeptId}
                            onValueChange={setSelectedDeptId}
                            disabled={isLoading}
                        >
                            <SelectTrigger id="department" className="border-amber-500/20 focus:ring-amber-500/20">
                                <SelectValue placeholder="Select a department" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">
                                    <span className="text-muted-foreground">No Department (Organization Level)</span>
                                </SelectItem>
                                {departments.map((dept) => (
                                    <SelectItem key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="role">Role in {selectedDeptId === "none" ? "Organization" : "Department"}</Label>
                        <Select
                            value={selectedRole}
                            onValueChange={(val) => setSelectedRole(val as TeamRole)}
                            disabled={isLoading}
                        >
                            <SelectTrigger id="role" className="border-amber-500/20 focus:ring-amber-500/20">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                {ALL_ROLES
                                    .filter(role => {
                                        // If Department is selected, typically exclude SUPER_ADMIN unless your logic allows Dept Super Admins
                                        // Assuming Depts only have ADMIN, MEMBER, VIEWER
                                        if (selectedDeptId !== "none" && role.value === 'SUPER_ADMIN') {
                                            return false;
                                        }
                                        return true;
                                    })
                                    .map((role) => (
                                        <SelectItem key={role.value} value={role.value}>
                                            {role.label}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading} className="border-amber-500/20 hover:bg-amber-500/10 hover:text-amber-500">
                        Cancel
                    </Button>
                    <Button onClick={handleAssign} disabled={isLoading} className="bg-amber-500 hover:bg-amber-600 text-black">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Assignment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
