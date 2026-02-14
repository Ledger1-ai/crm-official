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
import { CalendarIcon, ExternalLink, Search, UserPlus, X } from "lucide-react";
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

interface Lead {
  id: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  email: string | null;
}

const UpdateTaskDialog = ({ users, boards, boardId, initialData, onDone }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadSearch, setLeadSearch] = useState("");
  const [leadDropdownOpen, setLeadDropdownOpen] = useState(false);

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
    leadId: z.string().optional().nullable(),
    dueTime: z.string().optional(),
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
      boardId: boardId || initialData.section?.board || "",
      board: boardId || initialData.section?.board || "",
      opportunityId: initialData.opportunityId || undefined,
      taskStatus: initialData.taskStatus || "ACTIVE",
      leadId: initialData.leadId || "",
      dueTime: initialData.dueDateAt ? format(new Date(initialData.dueDateAt), "HH:mm") : "",
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const board = form.watch("board");

  useEffect(() => {
    // Load project-scoped opportunities for this board
    async function loadOpps() {
      if (!board) return;
      try {
        const res = await fetch(`/api/projects/${encodeURIComponent(board)}/opportunities`, { cache: "no-store" });
        if (res.ok) {
          const j = await res.json();
          setOpps((j?.opportunities || []) as Opportunity[]);
        }
      } catch { }
    }
    async function loadLeads() {
      try {
        const res = await axios.get("/api/crm/leads");
        setLeads(res.data || []);
      } catch { }
    }
    loadOpps();
    loadLeads();
  }, [board]);

  const filteredLeads = useMemo(() => {
    if (!leadSearch) return leads;
    const q = leadSearch.toLowerCase();
    return leads.filter((l) => {
      const name = `${l.firstName || ""} ${l.lastName || ""}`.toLowerCase();
      const company = (l.company || "").toLowerCase();
      const email = (l.email || "").toLowerCase();
      return name.includes(q) || company.includes(q) || email.includes(q);
    });
  }, [leads, leadSearch]);

  const getLeadLabel = (id: string) => {
    const lead = leads.find((l) => l.id === id);
    if (!lead) return "";
    const name = [lead.firstName, lead.lastName].filter(Boolean).join(" ");
    return name || lead.company || lead.email || "Unnamed Lead";
  };

  if (!isMounted) {
    return null;
  }

  //Actions
  // console.log("BoardId:", boardId);

  const onSubmit = async (data: UpdatedTaskForm) => {
    setIsLoading(true);
    try {
      // Merge date + time into a single DateTime
      const finalDate = new Date(data.dueDateAt);
      if (data.dueTime) {
        const [hours, minutes] = data.dueTime.split(":").map(Number);
        finalDate.setHours(hours, minutes, 0, 0);
      }
      const payload = { ...data, dueDateAt: finalDate, leadId: data.leadId || undefined };

      // Update task core fields
      await axios.put(`/api/projects/tasks/update-task/${initialData.id}`, payload);

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
                      <div className="flex items-center gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn("flex-1 pl-3 text-left font-normal bg-background", !field.value && "text-muted-foreground")}
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
                        <FormField
                          control={form.control}
                          name="dueTime"
                          render={({ field: timeField }) => (
                            <div className="w-[120px]">
                              <Input
                                type="time"
                                disabled={isLoading}
                                className="bg-background"
                                style={{ colorScheme: "dark" }}
                                {...timeField}
                                value={timeField.value ?? ""}
                              />
                            </div>
                          )}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="leadId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Assign to lead</FormLabel>
                      <div className="relative">
                        {field.value ? (
                          <div className="flex items-center justify-between h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                            <div className="flex items-center gap-2 truncate">
                              <UserPlus className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="truncate">{getLeadLabel(field.value)}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                field.onChange("");
                                setLeadSearch("");
                              }}
                              className="ml-2 shrink-0 rounded-full p-0.5 hover:bg-white/10 transition-colors"
                            >
                              <X className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                              <Input
                                placeholder="Search leads by name, company, or email..."
                                className="pl-9 bg-background"
                                value={leadSearch}
                                onChange={(e) => {
                                  setLeadSearch(e.target.value);
                                  setLeadDropdownOpen(true);
                                }}
                                onFocus={() => setLeadDropdownOpen(true)}
                                onBlur={() => {
                                  // Delay to allow click on item
                                  setTimeout(() => setLeadDropdownOpen(false), 200);
                                }}
                              />
                            </div>
                            {leadDropdownOpen && (
                              <div className="absolute z-50 w-full mt-1 max-h-40 overflow-y-auto rounded-md border border-white/10 bg-popover shadow-lg">
                                {filteredLeads.length === 0 ? (
                                  <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                                    {leads.length === 0 ? "No leads available" : "No matching leads"}
                                  </div>
                                ) : (
                                  filteredLeads.map((lead) => {
                                    const name = [lead.firstName, lead.lastName].filter(Boolean).join(" ");
                                    return (
                                      <button
                                        key={lead.id}
                                        type="button"
                                        className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors flex items-center justify-between gap-2"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                          field.onChange(lead.id);
                                          setLeadSearch("");
                                          setLeadDropdownOpen(false);
                                        }}
                                      >
                                        <div className="flex flex-col gap-0.5 overflow-hidden">
                                          <span className="text-sm font-medium truncate">
                                            {name || lead.company || "Unnamed Lead"}
                                          </span>
                                          <span className="text-[10px] text-muted-foreground truncate">
                                            {[lead.company, lead.email].filter(Boolean).join(" · ")}
                                          </span>
                                        </div>
                                      </button>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
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
                      <Select onValueChange={field.onChange} value={field.value ?? undefined}>
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
