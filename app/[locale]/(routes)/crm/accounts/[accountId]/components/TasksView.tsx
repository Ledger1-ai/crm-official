"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { crm_Accounts } from "@prisma/client";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isSameDay,
  isSameWeek,
  isSameMonth,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { columns } from "../tasks-data-table/components/columns";
import { TasksDataTable } from "../tasks-data-table/components/data-table";

import NewTaskForm from "./NewTaskForm";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

//TODO:
interface TasksViewProps {
  data: any;
  account: crm_Accounts | null;
}

const AccountsTasksView = ({ data, account }: TasksViewProps) => {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"all" | "day" | "week" | "month">("all");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const filteredData = React.useMemo(() => {
    if (!data) return [];
    if (view === "all") return data;

    return data.filter((task: any) => {
      if (!task.dueDateAt) return false;
      const taskDate = new Date(task.dueDateAt);

      if (view === "day") {
        return isSameDay(taskDate, currentDate);
      } else if (view === "week") {
        return isSameWeek(taskDate, currentDate, { weekStartsOn: 0 }); // Sunday start
      } else if (view === "month") {
        return isSameMonth(taskDate, currentDate);
      }
      return true;
    });
  }, [data, view, currentDate]);

  const navigatePrevious = () => {
    if (view === "day") setCurrentDate(subDays(currentDate, 1));
    if (view === "week") setCurrentDate(subWeeks(currentDate, 1));
    if (view === "month") setCurrentDate(subMonths(currentDate, 1));
  };

  const navigateNext = () => {
    if (view === "day") setCurrentDate(addDays(currentDate, 1));
    if (view === "week") setCurrentDate(addWeeks(currentDate, 1));
    if (view === "month") setCurrentDate(addMonths(currentDate, 1));
  };

  const getViewLabel = () => {
    if (view === "day") return format(currentDate, "MMMM d, yyyy");
    if (view === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
    }
    if (view === "month") return format(currentDate, "MMMM yyyy");
    return "All Tasks";
  };

  if (!isMounted) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
          <div>
            <CardTitle
              onClick={() => router.push("/campaigns/tasks")}
              className="cursor-pointer"
            >
              Tasks
            </CardTitle>
            <CardDescription>Manage tasks linked to this account</CardDescription>
          </div>

          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:items-center sm:space-x-2">
            {/* View Selector */}
            <div className="flex items-center bg-muted/50 p-1 rounded-lg border">
              {(["all", "day", "week", "month"] as const).map((v) => (
                <Button
                  key={v}
                  variant={view === v ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setView(v)}
                  className="h-7 text-xs capitalize"
                >
                  {v}
                </Button>
              ))}
            </div>

            {/* Navigation (Only show if not All) */}
            {view !== "all" && (
              <div className="flex items-center space-x-1 bg-muted/50 p-1 rounded-lg border">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={navigatePrevious}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-medium w-32 text-center truncate px-2">
                  {getViewLabel()}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={navigateNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex space-x-2">
              <Sheet open={open} onOpenChange={setOpen}>
                <Button
                  size="sm"
                  className="h-9"
                  onClick={() => setOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" /> New Task
                </Button>
                <SheetContent className="min-w-[500px] space-y-2">
                  <SheetHeader>
                    <SheetTitle>Create new Task</SheetTitle>
                  </SheetHeader>
                  <div className="h-full overflow-y-auto">
                    <NewTaskForm
                      account={account}
                      onFinish={() => setOpen(false)}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
        <Separator className="mt-4" />
      </CardHeader>
      <CardContent>
        {!filteredData || filteredData.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            {view === 'all' ? "No assigned tasks found" : `No tasks found for ${getViewLabel()}`}
          </div>
        ) : (
          <TasksDataTable data={filteredData} columns={columns} />
        )}
      </CardContent>
    </Card>
  );
};

export default AccountsTasksView;
