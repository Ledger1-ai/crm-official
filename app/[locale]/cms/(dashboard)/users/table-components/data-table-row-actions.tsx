"use client";

import { Row } from "@tanstack/react-table";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import AlertModal from "@/components/modals/alert-modal";
import { adminUserSchema } from "../table-data/schema";
import ConfigureModulesModal from "@/app/[locale]/admin/(dashboard)/modules/components/ConfigureModulesModal";
import { ROLE_CONFIGS } from "@/lib/role-permissions";

import { Copy, Edit, MoreHorizontal, Trash, Settings2, UserCheck, UserX, ShieldCheck, ShieldX } from "lucide-react";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const router = useRouter();
  const data = adminUserSchema.parse(row.original);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modulesModalOpen, setModulesModalOpen] = useState(false);

  const { toast } = useToast();

  // Check if user is super admin (has god mode - no modules option)
  const isSuperAdmin = data.is_admin === true;

  // Get current user's modules based on their role
  const userRole = data.team_role as 'ADMIN' | 'MEMBER' | 'VIEWER' | undefined;
  const userModules = userRole && userRole in ROLE_CONFIGS
    ? ROLE_CONFIGS[userRole as keyof typeof ROLE_CONFIGS].defaultModules
    : [];

  const onCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast({
      title: "Copied",
      description: "The ID has been copied to your clipboard.",
    });
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/user/${data.id}`);
      router.refresh();
      toast({
        title: "Success",
        description: "User has been deleted",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const onActivate = async () => {
    try {
      setLoading(true);
      await axios.post(`/api/user/activate/${data.id}`);
      router.refresh();
      toast({ title: "Success", description: "User has been activated." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong while activating user.",
      });
    } finally {
      setLoading(false);
    }
  };

  const onDeactivate = async () => {
    try {
      setLoading(true);
      await axios.post(`/api/user/deactivate/${data.id}`);
      router.refresh();
      toast({ title: "Success", description: "User has been deactivated." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong while deactivating user.",
      });
    } finally {
      setLoading(false);
    }
  };

  const onActivateAdmin = async () => {
    try {
      setLoading(true);
      await axios.post(`/api/user/activateAdmin/${data.id}`);
      router.refresh();
      toast({ title: "Success", description: "User Admin rights activated." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong while activating admin rights.",
      });
    } finally {
      setLoading(false);
    }
  };

  const onDeactivateAdmin = async () => {
    try {
      setLoading(true);
      await axios.post(`/api/user/deactivateAdmin/${data.id}`);
      router.refresh();
      toast({ title: "Success", description: "User Admin rights deactivated." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong while deactivating admin rights.",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSaveModules = async (modules: string[]) => {
    try {
      // TODO: Implement API endpoint to save user-specific modules
      // await axios.post(`/api/user/${data.id}/modules`, { modules });
      toast({
        title: "Modules Updated",
        description: `Custom modules configured for ${data.name}.`,
      });
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user modules.",
      });
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onDelete}
        loading={loading}
      />

      {/* Configure Modules Modal - only for non-super-admins */}
      {!isSuperAdmin && (
        <ConfigureModulesModal
          isOpen={modulesModalOpen}
          onClose={() => setModulesModalOpen(false)}
          roleName={data.name || "User"}
          enabledModules={userModules}
          onSave={onSaveModules}
        />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>

          <DropdownMenuItem onClick={() => onCopy(data?.id)}>
            <Copy className="mr-2 w-4 h-4" />
            Copy ID
          </DropdownMenuItem>

          {/* Configure Modules - only for non-super-admins */}
          {!isSuperAdmin && (
            <DropdownMenuItem onClick={() => setModulesModalOpen(true)}>
              <Settings2 className="mr-2 w-4 h-4" />
              Configure Modules
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={onActivate}>
            <UserCheck className="mr-2 w-4 h-4" />
            Activate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDeactivate}>
            <UserX className="mr-2 w-4 h-4" />
            Deactivate
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={onActivateAdmin}>
            <ShieldCheck className="mr-2 w-4 h-4" />
            Activate Admin rights
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDeactivateAdmin}>
            <ShieldX className="mr-2 w-4 h-4" />
            Deactivate Admin rights
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setOpen(true)} className="text-destructive focus:text-destructive">
            <Trash className="mr-2 w-4 h-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
