"use client";

import axios from "axios";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { getTaskDone, undoTaskDone } from "@/app/[locale]/(routes)/projects/actions/get-task-done";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Pencil, Building, UserPlus, Undo2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import UpdateTaskDialog from "@/app/[locale]/(routes)/projects/dialogs/UpdateTask";
import { getActiveUsers } from "@/actions/get-users";
import { useState } from "react";
import { Icons } from "@/components/ui/icons";
import { convertTaskToAccount } from "@/actions/projects/convert-task-to-account";


const TaskViewActions = ({
  taskId,
  users,
  boards,
  initialData,
}: {
  taskId: string;
  users: any;
  boards: any;
  initialData: any;
}) => {
  const { toast } = useToast();
  const router = useRouter();

  const [openEdit, setOpenEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  //console.log(initialData, "initialData");
  //console.log(openEdit, "openEdit");

  //Actions
  const onDone = async () => {
    setIsLoading(true);
    try {
      await getTaskDone(taskId);
      toast({
        title: "Success, task marked as done.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error, task not marked as done.",
      });
    } finally {
      setIsLoading(false);
      router.refresh();
    }
  };

  const onUndo = async () => {
    setIsLoading(true);
    try {
      await undoTaskDone(taskId);
      toast({
        title: "Success, task marked as active.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error, task not marked as active.",
      });
    } finally {
      setIsLoading(false);
      router.refresh();
    }
  };

  const onConvert = async () => {
    setIsConverting(true);
    try {
      const result = await convertTaskToAccount(taskId);
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        // Optional: Redirect to account?
        // router.push(`/crm/accounts/${result.accountId}`);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong during conversion.",
      });
    } finally {
      setIsConverting(false);
      router.refresh();
    }
  };

  return (
    <div className="space-x-2 pb-2">
      Task Actions:
      <Separator className="mb-5" />
      {initialData.taskStatus !== "COMPLETE" ? (
        <Badge
          variant={"outline"}
          onClick={onDone}
          className="cursor-pointer"
          aria-disabled={isLoading}
        >
          <CheckSquare className="w-4 h-4 mr-2" />
          {isLoading ? (
            <Icons.spinner className="animate-spin w-4 h-4 mr-2" />
          ) : (
            "Mark as done"
          )}
        </Badge>
      ) : (
        <Badge
          variant={"outline"}
          onClick={onUndo}
          className="cursor-pointer"
          aria-disabled={isLoading}
        >
          <Undo2 className="w-4 h-4 mr-2" />
          {isLoading ? (
            <Icons.spinner className="animate-spin w-4 h-4 mr-2" />
          ) : (
            "Mark as Active"
          )}
        </Badge>
      )}
      <Badge
        variant={"outline"}
        className="cursor-pointer"
        onClick={onConvert}
      >
        {isConverting ? (
          <Icons.spinner className="animate-spin w-4 h-4 mr-2" />
        ) : (
          <Building className="w-4 h-4 mr-2" />
        )}
        Convert to Account
      </Badge>
      <Badge
        variant={"outline"}
        className="cursor-pointer"
        onClick={() => setOpenEdit(true)}
      >
        <Pencil className="w-4 h-4 mr-2" />
        Edit
      </Badge>
      <Sheet open={openEdit} onOpenChange={(open) => setOpenEdit(open)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto md:overflow-y-hidden">
          <SheetHeader>
            <SheetTitle>Edit Task</SheetTitle>
          </SheetHeader>
          <UpdateTaskDialog
            users={users}
            boards={boards}
            initialData={initialData}
            onDone={() => setOpenEdit(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default TaskViewActions;
