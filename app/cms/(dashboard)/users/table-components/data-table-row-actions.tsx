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
import ConfigureModulesModal from "@/app/admin/(dashboard)/modules/components/ConfigureModulesModal";
import { ChangeRoleModal } from "../components/ChangeRoleModal";
import { AdminResetPasswordModal } from "../components/AdminResetPasswordModal";
import { ROLE_CONFIGS } from "@/lib/role-permissions";
import { Copy, Edit, MoreHorizontal, Trash, Settings2, UserCheck, UserX, ShieldCheck, ShieldX, KeyRound, Building2 } from "lucide-react";
import AssignDepartmentModal from "../components/AssignDepartmentModal"; // Import the modal

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  departments?: { id: string; name: string; }[];
}

export function DataTableRowActions<TData>({
  row,
  departments = [],
}: DataTableRowActionsProps<TData>) {
  const router = useRouter();
  const data = adminUserSchema.parse(row.original);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modulesModalOpen, setModulesModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [assignDepartmentModalOpen, setAssignDepartmentModalOpen] = useState(false);

  const { toast } = useToast();

  // Check if user is super admin (has god mode - no modules option)
  const isSuperAdmin = data.is_admin === true;

  // Get current user's modules (prioritize user-specific modules, then role defaults)
  const userRole = data.team_role as 'ADMIN' | 'MEMBER' | 'VIEWER' | undefined;

  // If assigned_modules is present (even empty array), use it. otherwise use defaults.
  // Note: We might want to treat undefined as "use default" but empty array as "no modules".
  const userModules = data.assigned_modules !== undefined && data.assigned_modules !== null
    ? data.assigned_modules
    : (userRole && userRole in ROLE_CONFIGS ? ROLE_CONFIGS[userRole as keyof typeof ROLE_CONFIGS].defaultModules : []);

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


  const onSaveModules = async (modules: string[]) => {
    try {
      // Update user modules via API
      await axios.post(`/api/user/${data.id}/modules`, { modules });
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

      {/* Configure Modules Modal - only for non-owners */}
      {data.team_role !== 'OWNER' && (
        <ConfigureModulesModal
          isOpen={modulesModalOpen}
          onClose={() => setModulesModalOpen(false)}
          roleName={data.name || "User"}
          enabledModules={userModules}
          onSave={onSaveModules}
          teamId={data.team_id || data.assigned_team?.id} // Pass team ID for effective permission fetch
          userRole={data.team_role} // Pass role
        />
      )}

      {/* Change Role Modal */}
      {roleModalOpen && (
        <ChangeRoleModal
          isOpen={roleModalOpen}
          onClose={() => setRoleModalOpen(false)}
          userId={data.id}
          userName={data.name || "User"}
          currentRole={userRole || "MEMBER"}
        />
      )}

      {/* Admin Reset Password Modal */}
      {passwordModalOpen && (
        <AdminResetPasswordModal
          isOpen={passwordModalOpen}
          onClose={() => setPasswordModalOpen(false)}
          userId={data.id}
          userName={data.name || "User"}
        />
      )}

      {/* Assign Department Modal */}
      <AssignDepartmentModal
        isOpen={assignDepartmentModalOpen}
        onClose={() => setAssignDepartmentModalOpen(false)}
        userId={data.id}
        userName={data.name || "User"}
        currentDepartmentId={data.assigned_team?.team_type === 'DEPARTMENT' ? data.assigned_team.id : null}
        currentRole={data.team_role as any}
        departments={departments}
      />

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

          {/* Configure Modules - Configurable for Admin and Member roles (but not Owner) */}
          {data.team_role !== 'OWNER' && (
            <DropdownMenuItem onClick={() => setModulesModalOpen(true)}>
              <Settings2 className="mr-2 w-4 h-4" />
              Configure Modules
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />



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

          {/* Change Role - Configurable for Admin and Member roles (but not Owner) */}
          <DropdownMenuItem onClick={() => setAssignDepartmentModalOpen(true)}>
            <Building2 className="mr-2 w-4 h-4" />
            Change Role/Team
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setPasswordModalOpen(true)}>
            <KeyRound className="mr-2 w-4 h-4" />
            Change Password
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
