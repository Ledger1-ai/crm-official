"use client";

import axios from "axios";
import moment from "moment";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState, useMemo } from "react";
import { Check, EyeIcon, Pencil, PlusCircle, PlusIcon } from "lucide-react";

import {
  ChatBubbleIcon,
  DotsHorizontalIcon,
  ExclamationTriangleIcon,
  TrashIcon,
} from "@radix-ui/react-icons";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import AlertModal from "@/components/modals/alert-modal";
import LoadingComponent from "@/components/LoadingComponent";
import { DialogHeader } from "@/components/ui/dialog-document-view";
import SidePanel from "@/components/ui/SidePanel";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import NewSectionForm from "../forms/NewSection";
import UpdateTaskDialog from "../../../dialogs/UpdateTask";
import { getTaskDone } from "../../../actions/get-task-done";
import KanbanColumn from "./KanbanColumn";

let timer: any;
const timeout = 1000;

interface Task {
  id: string;
  section: string;
}

const Kanban = (props: any) => {
  const boardId = props.boardId;
  const boards = props.boards;
  const users = props.users;

  const [data, setData]: any = useState([]);

  const [sectionId, setSectionId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [open, setOpen] = useState(false);
  const [openSectionAlert, setOpenSectionAlert] = useState(false);
  const [sectionOpenDialog, setSectionOpenDialog] = useState(false);
  const [updateOpenSheet, setUpdateOpenSheet] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSection, setIsLoadingSection] = useState(false);

  const router = useRouter();

  const { toast } = useToast();

  useEffect(() => {
    setData(props.data);
    setIsLoading(false);
  }, [props.data]);

  const [search, setSearch] = useState("");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  const filteredData = useMemo(() => {
    const matches = (t: any) => {
      if (filterAssignee !== "all" && t?.assigned_user?.id !== filterAssignee) return false;
      if (filterStatus !== "all") {
        if (filterStatus === "active" && t.taskStatus === "COMPLETE") return false;
        if (filterStatus === "complete" && t.taskStatus !== "COMPLETE") return false;
      }
      if (filterPriority !== "all") {
        const p = (t.priority || "").toLowerCase();
        if (p !== filterPriority) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const hay = `${t.title ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    };
    return (data || []).map((sec: any) => ({
      ...sec,
      tasks: (sec.tasks || []).filter(matches),
    }));
  }, [data, search, filterAssignee, filterStatus, filterPriority]);

  const onDragEnd = async ({ source, destination }: DropResult) => {
    if (!destination) return;
    console.log(source, "source - onDragEnd");
    console.log(destination, "destination - onDragEnd");
    const sourceColIndex = data.findIndex(
      (e: any) => e.id === source.droppableId
    );
    const destinationColIndex = data.findIndex(
      (e: any) => e.id === destination.droppableId
    );

    const sourceCol = data[sourceColIndex];
    if (!sourceCol) return null;
    const destinationCol = data[destinationColIndex];

    const sourceSectionId = sourceCol.id;
    const destinationSectionId = destinationCol.id;

    const sourceTasks = [...sourceCol.tasks];
    const destinationTasks = [...destinationCol.tasks];

    if (source.droppableId !== destination.droppableId) {
      const [removed] = sourceTasks.splice(source.index, 1);
      destinationTasks.splice(destination.index, 0, removed);
      data[sourceColIndex].tasks = sourceTasks;
      data[destinationColIndex].tasks = destinationTasks;
    } else {
      const [removed] = destinationTasks.splice(source.index, 1);
      destinationTasks.splice(destination.index, 0, removed);
      data[destinationColIndex].tasks = destinationTasks;
    }

    try {
      setData(data);
      await axios.put(`/api/projects/tasks/update-kanban-position`, {
        resourceList: sourceTasks,
        destinationList: destinationTasks,
        resourceSectionId: sourceSectionId,
        destinationSectionId: destinationSectionId,
      });
      toast({
        title: "Task moved",
        description: "New task position saved in database",
      });
    } catch (err) {
      alert(err);
    }
  };

  const onDeleteSection = async () => {
    setIsLoadingSection(true);
    try {
      await axios.delete(`/api/projects/sections/delete-section/${sectionId}`);
      const newData = [...data].filter((e) => e.id !== sectionId);
      setData(newData);
      toast({
        title: "Section deleted",
        description: "Section deleted successfully",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong, during deleting section",
      });
    } finally {
      setIsLoadingSection(false);
      setSectionId(null);
      setOpenSectionAlert(false);
      router.refresh();
    }
  };

  //Done
  const updateSectionTitle = async (
    e: ChangeEvent<HTMLInputElement>,
    sectionId: string
  ) => {
    clearTimeout(timer);
    const newTitle = e.target.value;
    const newData = [...data];
    const index = newData.findIndex((e) => e.id === sectionId);
    newData[index].title = newTitle;
    setData(newData);
    timer = setTimeout(async () => {
      try {
        //updateSection(sectionId, { title: newTitle });
        await axios.put(`/api/projects/sections/update-title/${sectionId}`, {
          newTitle,
        });
        toast({
          title: "Section title updated",
          description: "New section title saved in database",
        });
      } catch (err) {
        alert(err);
      }
    }, timeout);
  };

  //Done
  const createTask = async (sectionId: string) => {
    //console.log(sectionId, "sectionId - createTask");
    //const task = await addTask(boardId, sectionId);
    try {
      const task = await axios.post(
        `/api/projects/tasks/create-task/${boardId}`,
        {
          section: sectionId,
        }
      );
      //console.log(task, "task - createTask");
      const newData = [...data];
      //console.log(newData, "newData - createTask");
      const index = newData.findIndex((e) => e.id === sectionId);
      newData[index].tasks.unshift(task);
      setData(newData);
      toast({
        title: "Task created",
        description: "New task saved in database",
      });
    } catch (error) {
      console.log(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong, during creating task",
      });
    } finally {
      setIsLoading(false);
      router.refresh();
    }
  };

  const onDone = async (id: string) => {
    setIsLoading(true);
    try {
      await getTaskDone(id);
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

  const onDelete = async () => {
    setOpen(false);
    setIsLoading(true);
    if (!selectedTask || !selectedTask.id || !selectedTask.section) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid task. Please select a valid task to delete.",
      });
      setIsLoading(false);
      return;
    }
    try {
      await axios.delete(`/api/projects/tasks/`, {
        data: {
          id: selectedTask.id,
          section: selectedTask.section,
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
    } finally {
      setIsLoading(false);
      router.refresh();
    }
  };

  if (isLoading) return <LoadingComponent />;

  //console.log(sectionId, "sectionId - Kanban");
  //console.log(updateOpenSheet, "updateOpenSheet - Kanban");

  // ... (keep existing logic up to return)

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onDelete}
        loading={isLoading}
      />
      <AlertModal
        isOpen={openSectionAlert}
        onClose={() => setOpenSectionAlert(false)}
        onConfirm={onDeleteSection}
        loading={isLoadingSection}
      />

      {/* Dialogs */}
      <Dialog
        open={sectionOpenDialog}
        onOpenChange={() => setSectionOpenDialog(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="p-2">Create new section</DialogTitle>
            <DialogDescription className="p-2">
              Fill out the form below to create a new section to this project.
            </DialogDescription>
          </DialogHeader>
          <NewSectionForm
            boardId={boardId}
            onClose={() => setSectionOpenDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Side Panel */}
      <SidePanel
        isOpen={updateOpenSheet}
        onClose={() => setUpdateOpenSheet(false)}
      >
        <UpdateTaskDialog
          users={users}
          boards={boards}
          boardId={boardId}
          initialData={selectedTask}
          onDone={() => setUpdateOpenSheet(false)}
        />
      </SidePanel>

      <div className="flex flex-col h-full overflow-hidden">
        {/* Kanban Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-2 px-2 shrink-0">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-[200px] h-9 bg-background"
          />
          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger className="w-[160px] h-9 bg-background"><SelectValue placeholder="Assignee" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              {users?.map((u: any) => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] h-9 bg-background"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[140px] h-9 bg-background"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>

          {(search || filterAssignee !== "all" || filterStatus !== "all" || filterPriority !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(""); setFilterAssignee("all"); setFilterStatus("all"); setFilterPriority("all"); }}
              className="h-9"
            >
              Clear Filters
            </Button>
          )}

          <div className="ml-auto text-xs text-muted-foreground hidden md:block">
            {filteredData?.reduce((acc: number, sec: any) => acc + (sec.tasks?.length || 0), 0)} tasks in {filteredData?.length} sections
          </div>
        </div>

        {/* Kanban Board Area */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 px-2">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex h-full gap-4 snap-x snap-mandatory min-w-fit pr-10">
              {filteredData?.map((section: any, index: number) => (
                <KanbanColumn
                  key={section.id}
                  section={section}
                  index={index}
                  onUpdateTitle={updateSectionTitle}
                  onDeleteSection={(id) => { setSectionId(id); setOpenSectionAlert(true); }}
                  onCreateTask={createTask}
                  onViewTask={(task) => router.push(`/projects/tasks/viewtask/${task.id}`)}
                  onEditTask={(task) => { setSelectedTask(task); setUpdateOpenSheet(true); }}
                  onDeleteTask={(task) => { setSelectedTask(task); setOpen(true); }}
                  onDoneTask={(task) => onDone(task.id)}
                />
              ))}

              {/* Add Section Button Column */}
              <div className="shrink-0 w-80 h-full flex items-start justify-center pt-2 snap-center opacity-50 hover:opacity-100 transition-opacity">
                <Button
                  variant="outline"
                  className="w-full h-12 border-dashed border-2 bg-transparent hover:bg-muted/50"
                  onClick={() => setSectionOpenDialog(true)}
                >
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Add Section
                </Button>
              </div>
            </div>
          </DragDropContext>
        </div>
      </div>
    </>
  );
};

export default Kanban;
