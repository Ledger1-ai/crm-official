"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddRoleModal } from "./AddRoleModal";

interface DepartmentOption {
    id: string;
    name: string;
}

interface AddRoleButtonProps {
    teamId: string;
    departments: DepartmentOption[];
}

export function AddRoleButton({ teamId, departments }: AddRoleButtonProps) {
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
                departments={departments}
            />
        </>
    );
}
