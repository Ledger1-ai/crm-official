"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { taskSchema } from "../data/schema";
import { useRouter } from "next/navigation";
import AlertModal from "@/components/modals/alert-modal";
import { useState } from "react";
import axios from "axios";
import {
  Eye,
  EyeIcon,
  EyeOff,
  Glasses,
  Magnet,
  Pencil,
  Trash,
  Users,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import UpdateProjectForm from "../forms/UpdateProject";
import AssignMembersModal from "../dialogs/AssignMembersModal";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const router = useRouter();
  const project = taskSchema.parse(row.original);

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  const onDelete = async () => {
    setLoading(true);
    try {
      await axios.delete(`/api/campaigns/${project.id}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error, campaign not deleted. Please try again.",
      });
      console.log(error);
    } finally {
      toast({
        title: "Success",
        description: `Project: ${project.title}, deleted successfully`,
      });
      router.refresh();
      setOpen(false);
      setLoading(false);
    }
  };

  const onWatch = async () => {
    setLoading(true);
    try {
      await axios.post(`/api/campaigns/${project.id}/watch`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error, campaign not watched. Please try again.",
      });
      console.log(error);
    } finally {
      toast({
        title: "Success",
        description: `Project: ${project.title}, watched successfully`,
      });
      setLoading(false);
    }
  };

  const onUnWatch = async () => {
    setLoading(true);
    try {
      await axios.post(`/api/campaigns/${project.id}/unwatch`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error, campaign not watched. Please try again.",
      });
      console.log(error);
    } finally {
      toast({
        title: "Success",
        description: `Project: ${project.title}, You stop watching this project successfully`,
      });
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onDelete}
        loading={loading}
      />
      <Sheet open={editOpen} onOpenChange={() => setEditOpen(false)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit your project data</SheetTitle>
            <SheetDescription></SheetDescription>
          </SheetHeader>
          <UpdateProjectForm initialData={project} openEdit={setEditOpen} />
        </SheetContent>
      </Sheet>

      <AssignMembersModal
        projectId={project.id}
        projectTitle={project.title}
        isOpen={assignOpen}
        onClose={() => setAssignOpen(false)}
        onUpdate={() => router.refresh()}
      />

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-primary"
        onClick={() => router.push(`/campaigns/boards/${project.id}`)}
        title="View Board"
      >
        <Glasses className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-primary"
        onClick={() => setEditOpen(true)}
        title="Edit"
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-indigo-500"
        onClick={() => setAssignOpen(true)}
        title="Assign Members"
      >
        <Users className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-primary"
        onClick={onWatch}
        title="Watch Campaign"
      >
        <Eye className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={() => setOpen(true)}
        title="Delete"
      >
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  );
}
