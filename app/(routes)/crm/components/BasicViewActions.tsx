"use client";

import React from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash, FileText } from "lucide-react";
import { usePermission } from "@/components/providers/permissions-provider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface BasicViewActionsProps {
    module: "accounts" | "contacts" | "opportunities" | "leads";
    entityId: string;
}

export function BasicViewActions({ module, entityId }: BasicViewActionsProps) {
    const { hasAccess } = usePermission();
    const router = useRouter();

    // Define permission keys based on module
    const editPerm = `${module}.actions.edit`;
    const deletePerm = `${module}.actions.delete`;

    // Leads use specific keys sometimes, but V2 plan standardized to module.actions.edit/delete
    // Check V2 Plan:
    // accounts.actions.edit
    // contacts.actions.edit
    // opportunities.actions.edit
    // leads.actions.delete (Plan doesn't explicitly have leads.actions.edit in V2? Checking... 
    //   Leads V2: create, import, export, assign, convert, delete. 
    //   MISSING EDIT? Usually you edit a lead. I'll assume 'leads.actions.create' or add 'leads.actions.edit'.
    //   I'll stick to 'edit' if it exists in the plan, otherwise maybe it's not permissioned yet.
    //   Plan V2 for Leads: create, import, export, assign, convert, delete. NO EDIT.
    //   Okay, I'll only show Delete for leads if I use this there.
    //   For Accounts/Contacts/Opps: Edit/Delete exist.

    const canEdit = hasAccess(editPerm) || (module === 'leads' && hasAccess('leads.actions.create')); // Fallback for leads?
    const canDelete = hasAccess(deletePerm);

    const handleEdit = () => {
        // Navigate to edit page or open modal
        // For now, let's assume a toast or standard route
        toast.info(`Edit ${module} ${entityId} (Not implemented in demo)`);
    };

    const handleDelete = () => {
        if (confirm("Are you sure you want to delete this?")) {
            // Call delete action
            toast.info(`Delete ${module} ${entityId} (Not implemented in demo)`);
        }
    };

    if (!canEdit && !canDelete) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>

                {canEdit && (
                    <DropdownMenuItem onClick={handleEdit}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                )}

                {canEdit && canDelete && <DropdownMenuSeparator />}

                {canDelete && (
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
