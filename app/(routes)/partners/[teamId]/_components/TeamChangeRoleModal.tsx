"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LucideIcon } from "lucide-react";

export interface RoleOption {
    value: string;
    label: string;
    description: string;
    icon: LucideIcon;
}

interface TeamChangeRoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    memberId: string;
    memberName: string;
    currentRole: string;
    allowedRoles: RoleOption[];
    onConfirm: (memberId: string, newRole: string) => Promise<void>;
}

export const TeamChangeRoleModal: React.FC<TeamChangeRoleModalProps> = ({
    isOpen,
    onClose,
    memberId,
    memberName,
    currentRole,
    allowedRoles,
    onConfirm,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    // If current role isn't in allowed list (e.g. Owner), default to empty or first allowed
    const [selectedRole, setSelectedRole] = useState(
        allowedRoles.some(r => r.value === currentRole) ? currentRole : allowedRoles[0]?.value || ""
    );

    const handleConfirm = async () => {
        if (!selectedRole) return;
        try {
            setIsLoading(true);
            await onConfirm(memberId, selectedRole);
            onClose();
        } catch (error) {
            console.error(error);
            // Error handling is likely done in onConfirm, but safe fallback here
            toast.error("Failed to update role");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Change Role</DialogTitle>
                    <DialogDescription>
                        Update access level for <span className="font-medium text-foreground">{memberName}</span>.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">
                            Role
                        </Label>
                        <Select
                            disabled={isLoading}
                            onValueChange={setSelectedRole}
                            value={selectedRole}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                {allowedRoles.map((role) => (
                                    <SelectItem key={role.value} value={role.value}>
                                        <div className="flex items-center gap-2">
                                            <role.icon className="w-4 h-4 text-muted-foreground" />
                                            <span>{role.label}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Role Description Helper */}
                    <div className="pl-[25%] text-sm text-muted-foreground">
                        {allowedRoles.find(r => r.value === selectedRole)?.description}
                    </div>

                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} disabled={isLoading || selectedRole === currentRole}>
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
