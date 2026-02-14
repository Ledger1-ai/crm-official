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
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DeleteRoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    roleId: string;
    roleName: string;
}

export const DeleteRoleModal: React.FC<DeleteRoleModalProps> = ({
    isOpen,
    onClose,
    roleId,
    roleName,
}) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const onConfirm = async () => {
        try {
            setIsLoading(true);
            await axios.delete(`/api/roles/${roleId}`);
            toast.success("Role deleted successfully.");
            router.refresh();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete role.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-destructive mb-2">
                        <AlertTriangle className="h-5 w-5" />
                        <DialogTitle>Delete Role</DialogTitle>
                    </div>
                    <DialogDescription>
                        Are you sure you want to delete the <span className="font-semibold text-foreground">{roleName}</span> role?
                        <br /><br />
                        This action cannot be undone. Users assigned to this role will lose their custom permissions.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={onConfirm} disabled={isLoading} variant="destructive">
                        Delete Role
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
