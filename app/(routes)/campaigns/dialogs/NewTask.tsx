"use client";

import LoadingComponent from "@/components/LoadingComponent";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { CalendarIcon, Search, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";

import React, { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { priorities } from "../tasks/data/data";

interface Lead {
  id: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  email: string | null;
}

type Props = {
  users: any;
  boards: any;
  customTrigger?: React.ReactNode;
};

const NewTaskDialog = ({ users, boards, customTrigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadSearch, setLeadSearch] = useState("");
  const [leadDropdownOpen, setLeadDropdownOpen] = useState(false);

  const [isMounted, setIsMounted] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const formSchema = z.object({
    title: z.string().min(3).max(255),
    user: z.string().min(3).max(255),
    board: z.string().min(3).max(255),
    priority: z.string().min(3).max(10),
    content: z.string().min(3).max(500),
    dueDateAt: z.date(),
    dueTime: z.string().optional(),
    leadId: z.string().optional(),
  });

  type NewAccountFormValues = z.infer<typeof formSchema>;

  const form = useForm<NewAccountFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      user: "",
      board: "",
      priority: "",
      content: "",
      dueDateAt: new Date(),
      dueTime: "",
      leadId: "",
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch leads when dialog opens
  useEffect(() => {
    if (open) {
      axios.get("/api/crm/leads").then((res) => {
        setLeads(res.data || []);
      }).catch(() => setLeads([]));
    }
  }, [open]);

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

  const onSubmit = async (data: NewAccountFormValues) => {
    // Merge date + time into a single DateTime
    const finalDate = new Date(data.dueDateAt);
    if (data.dueTime) {
      const [hours, minutes] = data.dueTime.split(":").map(Number);
      finalDate.setHours(hours, minutes, 0, 0);
    }
    const payload = { ...data, dueDateAt: finalDate, leadId: data.leadId || undefined };

    console.log(payload);
    setIsLoading(true);
    try {
      await axios.post(`/api/campaigns/tasks/create-task`, payload);
      toast({
        title: "Success",
        description: `New task: ${data.title}, created successfully`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.response?.data,
      });
    } finally {
      setIsLoading(false);
      setOpen(false);
      form.reset({
        title: "",
        content: "",
        user: "",
        board: "",
        priority: "",
        dueTime: "",
        leadId: "",
      });
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {customTrigger ? (
          <div className="cursor-pointer" onClick={() => setOpen(true)}>{customTrigger}</div>
        ) : (
          <Button className="px-2">Create task</Button>
        )}
      </DialogTrigger>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle className="p-2">Create New Task</DialogTitle>
          <DialogDescription className="p-2">
            Fill out the form below to create a new task.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <LoadingComponent />
        ) : (
          <div className="flex w-full ">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="h-full w-full space-y-3"
              >
                <div className="flex flex-col space-y-3">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New task name</FormLabel>
                        <FormControl>
                          <Input
                            disabled={isLoading}
                            placeholder="Enter task name"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task description</FormLabel>
                        <FormControl>
                          <Textarea
                            disabled={isLoading}
                            placeholder="Enter task description"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-end gap-3">
                    <FormField
                      control={form.control}
                      name="dueDateAt"
                      render={({ field }) => (
                        <FormItem className="flex flex-col flex-1">
                          <FormLabel>Due date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a due date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                //@ts-ignore
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
                      name="dueTime"
                      render={({ field }) => (
                        <FormItem className="flex flex-col w-[130px]">
                          <FormLabel>Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              disabled={isLoading}
                              style={{ colorScheme: "dark" }}
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="user"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assigned to</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select assigned user" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="h-56 overflow-y-auto">
                            {users.map((user: any) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name}
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
                    name="board"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Choose project</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select tasks board" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {boards.map((board: any) => (
                              <SelectItem key={board.id} value={board.id}>
                                {board.title}
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
                    name="leadId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign to lead</FormLabel>
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
                                  className="pl-9"
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
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Choose task priority</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select tasks priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {priorities.map((p: any) => (
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
                </div>
                <div className="flex w-full justify-end space-x-2 pt-2">
                  <DialogTrigger asChild>
                    <Button variant={"destructive"}>Cancel</Button>
                  </DialogTrigger>
                  <Button type="submit">Create</Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewTaskDialog;
