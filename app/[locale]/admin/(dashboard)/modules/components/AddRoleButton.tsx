"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddRoleModal } from "./AddRoleModal";

interface AddRoleButtonProps {
    teamId: string;
}

export function AddRoleButton({ teamId }: AddRoleButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button size="sm" onClick={() => setIsOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Role
            </Button>
            <AddRoleModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                teamId={teamId}
            />
        </>
    );
}
