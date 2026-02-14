"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
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
import { Shield, Users, Eye } from "lucide-react";

interface ChangeRoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
    currentRole: string;
}

const roles = [
    {
        value: "ADMIN",
        label: "Admin",
        description: "Full access to manage team and settings.",
        icon: Shield,
    },
    {
        value: "MEMBER",
        label: "Member",
        description: "Can access standard features and modules.",
        icon: Users,
    },
    {
        value: "VIEWER",
        label: "Viewer",
        description: "Read-only access to allowed resources.",
        icon: Eye,
    },
];

export const ChangeRoleModal: React.FC<ChangeRoleModalProps> = ({
    isOpen,
    onClose,
    userId,
    userName,
    currentRole,
}) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState(currentRole);

    const onConfirm = async () => {
        try {
            setIsLoading(true);
            await axios.patch(`/api/user/${userId}/role`, {
                team_role: selectedRole,
            });
            toast.success("User role updated");
            router.refresh();
            onClose();
        } catch (error) {
            toast.error("Something went wrong");
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
                        Update the access level for <span className="font-medium text-foreground">{userName}</span>.
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
                                {roles.map((role) => (
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
                        {roles.find(r => r.value === selectedRole)?.description}
                    </div>

                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={onConfirm} disabled={isLoading}>
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
