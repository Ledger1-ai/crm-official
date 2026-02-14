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

interface AdminResetPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
}

export const AdminResetPasswordModal: React.FC<AdminResetPasswordModalProps> = ({
    isOpen,
    onClose,
    userId,
    userName,
}) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const onConfirm = async () => {
        try {
            setIsLoading(true);
            await axios.post(`/api/user/${userId}/admin-reset-password`);
            toast.success("Password reset email sent.");
            router.refresh();
            onClose();
        } catch (error) {
            toast.error("Failed to reset password.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-amber-600 mb-2">
                        <AlertTriangle className="h-5 w-5" />
                        <DialogTitle>Reset Password</DialogTitle>
                    </div>
                    <DialogDescription asChild>
                        <div>
                            Are you sure you want to reset the password for <span className="font-semibold text-foreground">{userName}</span>?
                            <br /><br />
                            This will:
                            <ul className="list-disc pl-5 mt-1 space-y-1">
                                <li>Generate a temporary password.</li>
                                <li>Send an email to the user.</li>
                                <li>Force them to change it on next login.</li>
                            </ul>
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={onConfirm} disabled={isLoading} variant="destructive">
                        Reset Password
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
