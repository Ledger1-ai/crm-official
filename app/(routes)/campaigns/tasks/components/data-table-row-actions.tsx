"use client";

import axios from "axios";
import { useState } from "react";
import { Row } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import AlertModal from "@/components/modals/alert-modal";

import { taskSchema } from "../data/schema";
import { Check, Undo2 } from "lucide-react";
import { getTaskDone, undoTaskDone } from "../../actions/get-task-done";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const router = useRouter();
  const task = taskSchema.parse(row.original);

  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onDelete = async () => {
    setIsLoading(true);
    try {
      await axios.delete(`/api/campaigns/tasks/`, {
        data: {
          id: task?.id,
          section: task?.section,
        },
      });
      toast({
        title: "Task deleted",
        description: "Task deleted successfully",
      });
    } catch (error) {
      console.log(error);
      toast({
        variant: "destructive",
        title: "Task deleted",
        description: "Something went wrong, during deleting task",
      });
      setIsLoading(false);
      setOpen(false);
    } finally {
      setOpen(false);
      setIsLoading(false);
      router.refresh();
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onDelete}
        loading={isLoading}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <DotsHorizontalIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem
            onClick={() => router.push(`/campaigns/tasks/viewtask/${task?.id}`)}
          >
            View
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {task.taskStatus !== "COMPLETE" ? (
            <DropdownMenuItem onClick={async () => {
              await getTaskDone(task.id);
              router.refresh();
              toast({ title: "Task marked as done" });
            }}>
              <Check className="h-4 w-4 mr-2" />
              Mark as Done
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={async () => {
              await undoTaskDone(task.id);
              router.refresh();
              toast({ title: "Task marked as active" });
            }}>
              <Undo2 className="h-4 w-4 mr-2" />
              Mark as Active
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpen(true)}>
            Delete
            <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
