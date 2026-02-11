"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Icons } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";

import { format } from "date-fns";
import { CalendarIcon, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { priorities, statuses } from "../tasks/data/data";

type Props = {
  users: any;
  boards: any;
  boardId?: string; // projectId / board id
  initialData: any; // task
  onDone?: () => void;
};

type Opportunity = {
  id: string;
  title: string;
  status?: string;
};

const UpdateTaskDialog = ({ users, boards, boardId, initialData, onDone }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [opps, setOpps] = useState<Opportunity[]>([]);

  const router = useRouter();
  const { toast } = useToast();

  const formSchema = z.object({
    title: z.string().min(3).max(255),
    user: z.string().min(3).max(255),
    dueDateAt: z.date(),
    priority: z.string().min(3).max(10),
    content: z.string().min(3).max(500),
    boardId: z.string().min(3).max(255),
    board: z.string().min(3).max(255),
    opportunityId: z.string().optional(),
    taskStatus: z.string().min(3).max(20).optional().nullable(),
  });

  type UpdatedTaskForm = z.infer<typeof formSchema>;

  const form = useForm<UpdatedTaskForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData.title,
      user: initialData.user || initialData.assigned_user?.id || "",
      dueDateAt: initialData.dueDateAt ? new Date(initialData.dueDateAt) : new Date(),
      priority: initialData.priority,
      content: initialData.content,
      boardId: boardId,
      board: boardId,
      opportunityId: undefined,
      taskStatus: initialData.taskStatus || "ACTIVE",
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Load project-scoped opportunities for this board
    async function loadOpps() {
      if (!boardId) return;
      try {
        const res = await fetch(`/api/projects/${encodeURIComponent(boardId)}/opportunities`, { cache: "no-store" });
        if (res.ok) {
          const j = await res.json();
          setOpps((j?.opportunities || []) as Opportunity[]);
        }
      } catch { }
    }
    loadOpps();
  }, [boardId]);

  if (!isMounted) {
    return null;
  }

  //Actions
  // console.log("BoardId:", boardId);

  const onSubmit = async (data: UpdatedTaskForm) => {
    setIsLoading(true);
    try {
      // Update task core fields
      await axios.put(`/api/projects/tasks/update-task/${initialData.id}`, data);

      // If an opportunity was chosen, link it to this task
      if (data.opportunityId && boardId) {
        await fetch(`/api/projects/${encodeURIComponent(boardId)}/opportunities/${encodeURIComponent(data.opportunityId)}/link-task`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId: initialData.id }),
        });
      }

      toast({ title: "Success", description: `Task: ${data.title}, updated successfully` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error?.response?.data || "Update failed" });
    } finally {
      setIsLoading(false);
      onDone && onDone();
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <p className="text-xs text-muted-foreground">ID: {initialData.id}</p>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={() => router.push(`/projects/tasks/viewtask/${initialData.id}`)}
        >
          <ExternalLink className="w-3 h-3" />
          Full Page
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-1">
          <div className="space-y-4">
            {/* Task Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">Task Title</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="Enter task name"
                      className="font-medium text-lg h-10"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={isLoading}
                      placeholder="Add more details to this task..."
                      className="min-h-[120px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Details Section */}
            <div className="p-3 rounded-lg border bg-muted/10 space-y-3">
              <h3 className="font-medium text-sm">Details</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="user"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Assignee</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map((user: any) => (
                            <SelectItem key={user.id} value={user.id}>
                              <div className="flex items-center gap-2">
                                {user.avatar && (
                                  <img src={user.avatar} className="w-4 h-4 rounded-full" alt="" />
                                )}
                                <span>{user.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {priorities.map((p) => (
                            <SelectItem key={p.value} value={p.value} className={cn("capitalize", p.color)}>
                              <div className="flex items-center gap-2">
                                <div className={cn("h-2 w-2 rounded-full", p.dotColor)} />
                                {p.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDateAt"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs">Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn("w-full pl-3 text-left font-normal bg-background", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="opportunityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Linked Opportunity</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {opps.map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {o.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taskStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statuses.map((s) => (
                            <SelectItem key={s.value} value={s.value} className={cn("capitalize", s.color)}>
                              <div className="flex items-center gap-2">
                                {s.icon && <s.icon className="h-4 w-4" />}
                                {s.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? <Icons.spinner className="animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default UpdateTaskDialog;
