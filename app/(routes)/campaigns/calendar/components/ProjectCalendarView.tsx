"use client";

import React, { useMemo, useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import fetcher from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    ChevronLeft,
    ChevronRight,
    Loader2,
    Circle,
    Plus,
    Calendar as CalendarIcon,
    List,
    LayoutGrid,
    Clock,
    CheckCircle2,
    ArrowRight,
    LayoutDashboard,
    Users,
    Zap
} from "lucide-react";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
    addMonths,
    subMonths,
    addWeeks,
    subWeeks,
    getDay,
} from "date-fns";
import Link from "next/link";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { priorities, statuses } from "../../tasks/data/data";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Building2, Target, Search, Check, ChevronsUpDown } from "lucide-react";
import useDebounce from "@/hooks/useDebounce";

type Props = { userId: string };

type CalendarView = "month" | "week" | "agenda";

interface TaskEvent {
    id: string;
    title: string;
    dueDateAt: Date;
    priority?: string;
    projectTitle?: string;
    projectId?: string;
    taskStatus?: string;
    assignedUserId?: string;
    createdBy?: string;
}

export default function ProjectCalendarView({ userId }: Props) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [view, setView] = useState<CalendarView>("month");
    const [quickAddDate, setQuickAddDate] = useState<Date | null>(null);
    const [quickAddOpen, setQuickAddOpen] = useState(false);
    const [fullDialogOpen, setFullDialogOpen] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskPriority, setNewTaskPriority] = useState("normal");
    const [newTaskStatus, setNewTaskStatus] = useState("ACTIVE");
    const [todayTasksOpen, setTodayTasksOpen] = useState(false);
    const [newTaskProjectId, setNewTaskProjectId] = useState("");
    const [newTaskDescription, setNewTaskDescription] = useState("");
    const [linkedRecordId, setLinkedRecordId] = useState("");
    const [linkedRecordType, setLinkedRecordType] = useState(""); // 'account' | 'opportunity' | 'contact' etc
    const [linkedRecordName, setLinkedRecordName] = useState("");

    // Search State
    const [projectSearchOpen, setProjectSearchOpen] = useState(false);
    const [linkSearchOpen, setLinkSearchOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const debouncedSearch = useDebounce(searchValue, 300);
    const [searchResults, setSearchResults] = useState<any>(null);
    const [isSearching, setIsSearching] = useState(false);

    // Global Search API logic
    useEffect(() => {
        const fetchGlobalResults = async () => {
            if (!debouncedSearch || debouncedSearch.length < 2) {
                setSearchResults(null);
                return;
            }
            if (!projectSearchOpen && !linkSearchOpen) return;

            setIsSearching(true);
            try {
                const response = await axios.post("/api/fulltext-search", { data: debouncedSearch });
                setSearchResults(response.data.data);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setIsSearching(false);
            }
        };

        fetchGlobalResults();
    }, [debouncedSearch, projectSearchOpen, linkSearchOpen]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch all tasks
    const { data: tasksData, isLoading } = useSWR<{ tasks?: any[] }>(
        `/api/campaigns/tasks`,
        fetcher,
        { refreshInterval: 60000 }
    );

    // Fetch users and boards for full dialog
    const { data: usersData } = useSWR("/api/user", fetcher);
    const { data: boardsData } = useSWR("/api/campaigns", fetcher);

    const users = usersData?.users || [];
    const boards = boardsData?.data || [];

    // Transform tasks into events
    const events = useMemo(() => {
        const tasks = tasksData?.tasks || [];
        return tasks
            .filter((t: any) => t.dueDateAt)
            .map((t: any) => ({
                id: t.id,
                title: t.title || "Untitled",
                dueDateAt: new Date(t.dueDateAt),
                priority: t.priority?.toLowerCase() || "normal",
                projectTitle: t.board?.title,
                projectId: t.board?.id,
                taskStatus: t.taskStatus,
                assignedUserId: t.assigned_user?.id || t.user,
                createdBy: t.createdBy,
            }));
    }, [tasksData]);

    const todayTasks = useMemo(() => {
        const today = new Date();
        const todayStr = format(today, "yyyy-MM-dd");

        return events.filter(e => {
            const taskDateStr = format(e.dueDateAt, "yyyy-MM-dd");
            const isTodayMatch = taskDateStr === todayStr;
            if (!isTodayMatch) return false;

            const isAssigned = e.assignedUserId?.toString() === userId?.toString();
            const isCreator = e.createdBy?.toString() === userId?.toString();

            return isAssigned || isCreator;
        });
    }, [events, userId]);

    // Get days based on view
    const viewDays = useMemo(() => {
        if (view === "week") {
            const start = startOfWeek(currentMonth, { weekStartsOn: 0 });
            const end = endOfWeek(currentMonth, { weekStartsOn: 0 });
            return eachDayOfInterval({ start, end });
        }
        // Month view
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        const days = eachDayOfInterval({ start, end });
        const startDayOfWeek = getDay(start);
        const paddedDays = [];
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            paddedDays.push(new Date(start.getTime() - (i + 1) * 86400000));
        }
        return [...paddedDays, ...days];
    }, [currentMonth, view]);

    // Get events for a specific day
    const getEventsForDay = (day: Date) => {
        return events.filter((e) => isSameDay(e.dueDateAt, day));
    };

    // Agenda events (for the entire selected month)
    const agendaEvents = useMemo(() => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        return events
            .filter((e) => e.dueDateAt >= start && e.dueDateAt <= end)
            .sort((a, b) => a.dueDateAt.getTime() - b.dueDateAt.getTime());
    }, [events, currentMonth]);

    const groupedAgendaEvents = useMemo(() => {
        const groups: Record<string, { date: Date, tasks: TaskEvent[] }> = {};
        agendaEvents.forEach(event => {
            const dateStr = format(event.dueDateAt, 'yyyy-MM-dd');
            if (!groups[dateStr]) {
                groups[dateStr] = {
                    date: event.dueDateAt,
                    tasks: []
                };
            }
            groups[dateStr].tasks.push(event);
        });
        return Object.values(groups);
    }, [agendaEvents]);

    const priorityColors = useMemo(() => {
        const colors: Record<string, string> = {};
        priorities.forEach(p => {
            colors[p.value] = p.dotColor || "bg-muted-foreground";
        });
        return colors;
    }, []);

    const priorityLabels = useMemo(() => {
        const labels: Record<string, string> = {};
        priorities.forEach(p => {
            labels[p.value] = p.label;
        });
        return labels;
    }, []);

    const getPriorityBadgeVariant = (priority: string) => {
        const p = priority?.toLowerCase();
        if (p === "high" || p === "critical") return "destructive";
        if (p === "low") return "secondary";
        return "default";
    };

    const StatusDot = ({ priority, size = "md" }: { priority?: string, size?: "sm" | "md" | "lg" }) => {
        const colorClass = priorityColors[priority?.toLowerCase() || "normal"] || "bg-muted-foreground";
        const sizeClasses = {
            sm: "h-2 w-2",
            md: "h-2.5 w-2.5",
            lg: "h-3 w-3"
        };
        return <div className={`${sizeClasses[size]} rounded-full shrink-0 ${colorClass}`} />;
    };

    const handleDayClick = (day: Date) => {
        setQuickAddDate(day);
        setSearchValue("");
        setNewTaskProjectId(boards[0]?.id || "");
        setQuickAddOpen(true);
        setNewTaskTitle("");
        setNewTaskDescription("");
        setNewTaskPriority("normal");
        setNewTaskStatus("ACTIVE");
    };

    const handleQuickAdd = async () => {
        if (!newTaskTitle.trim() || !quickAddDate) return;
        setIsSubmitting(true);
        try {
            await axios.post("/api/campaigns/tasks/create-task", {
                title: newTaskTitle,
                priority: newTaskPriority,
                taskStatus: newTaskStatus,
                dueDateAt: quickAddDate,
                content: newTaskDescription,
                user: userId,
                board: newTaskProjectId || boards[0]?.id || "",
                accountId: linkedRecordType === 'account' ? linkedRecordId : undefined,
                opportunityId: linkedRecordType === 'opportunity' ? linkedRecordId : undefined,
                contactId: linkedRecordType === 'contact' ? linkedRecordId : undefined,
                leadId: linkedRecordType === 'lead' ? linkedRecordId : undefined,
            });
            toast.success("Task created!");
            mutate("/api/campaigns/tasks");
            setQuickAddOpen(false);
            setNewTaskTitle("");
            setLinkedRecordId("");
            setLinkedRecordType("");
            setLinkedRecordName("");
            setNewTaskStatus("ACTIVE");
            setNewTaskPriority("normal");
            setNewTaskDescription("");
        } catch (error: any) {
            toast.error(error?.response?.data || "Failed to create task");
        } finally {
            setIsSubmitting(false);
        }
    };

    const navigatePrev = () => {
        if (view === "week") {
            setCurrentMonth(subWeeks(currentMonth, 1));
        } else {
            setCurrentMonth(subMonths(currentMonth, 1));
        }
    };

    const navigateNext = () => {
        if (view === "week") {
            setCurrentMonth(addWeeks(currentMonth, 1));
        } else {
            setCurrentMonth(addMonths(currentMonth, 1));
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-3" />
                Loading calendar...
            </div>
        );
    }

    return (
        <div className="py-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={navigatePrev}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-xl font-bold min-w-[200px] text-center">
                        {view === "week"
                            ? `Week of ${format(startOfWeek(currentMonth, { weekStartsOn: 0 }), "MMM d, yyyy")}`
                            : format(currentMonth, "MMMM yyyy")}
                    </h2>
                    <Button variant="outline" size="icon" onClick={navigateNext}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    <div className="flex items-center bg-muted/50 border border-border/50 rounded-md p-1 gap-0.5">
                        <button
                            type="button"
                            onClick={() => setView("month")}
                            className={`p-1.5 rounded transition-all ${view === "month"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                }`}
                            title="Month View"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setView("week")}
                            className={`p-1.5 rounded transition-all ${view === "week"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                }`}
                            title="Week View"
                        >
                            <CalendarIcon className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setView("agenda")}
                            className={`p-1.5 rounded transition-all ${view === "agenda"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                }`}
                            title="Agenda View"
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => {
                            setCurrentMonth(new Date());
                            setTodayTasksOpen(true);
                        }}
                    >
                        Today
                    </Button>

                    <Button onClick={() => {
                        setQuickAddDate(new Date());
                        setQuickAddOpen(true);
                        setNewTaskTitle("");
                        setNewTaskDescription("");
                        setNewTaskPriority("normal");
                        setNewTaskStatus("ACTIVE");
                    }}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Task
                    </Button>
                </div>
            </div>

            {/* Quick Add Popover */}
            <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5 text-primary" />
                            Create New Task
                        </DialogTitle>
                        <DialogDescription>
                            Quickly add a task to your schedule.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</label>
                            <Input
                                placeholder="What needs to be done?"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
                                autoFocus
                                className="bg-muted/30 border-border/50 focus:border-primary/50 transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description (Optional)</label>
                            <textarea
                                placeholder="Add more details..."
                                value={newTaskDescription}
                                onChange={(e) => setNewTaskDescription(e.target.value)}
                                className="w-full min-h-[80px] p-3 rounded-md text-sm bg-muted/30 border border-border/50 focus:border-primary/50 focus:outline-none transition-colors"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</label>
                                <Select value={newTaskStatus} onValueChange={setNewTaskStatus}>
                                    <SelectTrigger className="bg-muted/30 border-border/50">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statuses.map((status) => (
                                            <SelectItem key={status.value} value={status.value}>
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-2 w-2 rounded-full ${status.color.replace("text-", "bg-")}`} />
                                                    {status.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Due Date</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal bg-muted/30 border-border/50 h-9 px-3 text-sm",
                                                !quickAddDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {quickAddDate ? format(quickAddDate, "MMM d") : <span>Pick date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={quickAddDate || undefined}
                                            onSelect={(date) => setQuickAddDate(date || new Date())}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority</label>
                                <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                                    <SelectTrigger className="bg-muted/30 border-border/50">
                                        <SelectValue placeholder="Priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {priorities.map((priority) => (
                                            <SelectItem key={priority.value} value={priority.value}>
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-2 w-2 rounded-full ${priority.dotColor}`} />
                                                    {priority.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Project Selection */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Project / Board</label>
                                <Popover open={projectSearchOpen} onOpenChange={setProjectSearchOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className="w-full justify-between bg-muted/30 border-border/50 font-normal h-9 text-xs"
                                        >
                                            <span className="truncate">
                                                {newTaskProjectId
                                                    ? boards.find((b: any) => b.id === newTaskProjectId)?.title || "Selected Campaign"
                                                    : "Search campaigns..."}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0" align="start">
                                        <Command shouldFilter={false}>
                                            <CommandInput
                                                placeholder="Type to search campaigns..."
                                                onValueChange={setSearchValue}
                                            />
                                            <CommandList>
                                                <CommandEmpty>{isSearching ? "Searching..." : "No campaigns found."}</CommandEmpty>
                                                <CommandGroup heading="Suggestions">
                                                    {boards.slice(0, 5).map((board: any) => (
                                                        <CommandItem
                                                            key={board.id}
                                                            value={board.id}
                                                            onSelect={() => {
                                                                setNewTaskProjectId(board.id);
                                                                setProjectSearchOpen(false);
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", newTaskProjectId === board.id ? "opacity-100" : "opacity-0")} />
                                                            {board.title}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                                {searchResults?.projects?.length > 0 && (
                                                    <CommandGroup heading="Search Results">
                                                        {searchResults.projects.map((p: any) => (
                                                            <CommandItem
                                                                key={p.id}
                                                                value={p.id}
                                                                onSelect={() => {
                                                                    setNewTaskProjectId(p.id);
                                                                    setProjectSearchOpen(false);
                                                                }}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <LayoutDashboard className="h-4 w-4 opacity-50" />
                                                                    {p.title}
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                )}
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* CRM Linkage */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">CRM Linkage</label>
                                <Popover open={linkSearchOpen} onOpenChange={setLinkSearchOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-between bg-muted/30 border-border/50 font-normal h-9 text-xs"
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                {linkedRecordType === 'account' && <Building2 className="h-3 w-3 text-blue-400" />}
                                                {linkedRecordType === 'opportunity' && <Target className="h-3 w-3 text-purple-400" />}
                                                <span className="truncate">{linkedRecordName || "Optional Link..."}</span>
                                            </div>
                                            <Search className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0" align="end">
                                        <Command shouldFilter={false}>
                                            <CommandInput
                                                placeholder="Search accounts or opportunities..."
                                                onValueChange={setSearchValue}
                                            />
                                            <CommandList>
                                                <CommandEmpty>{isSearching ? "Searching..." : "No results found."}</CommandEmpty>

                                                {(searchResults?.accounts?.length > 0 || searchResults?.opportunities?.length > 0) ? (
                                                    <>
                                                        {searchResults?.accounts?.length > 0 && (
                                                            <CommandGroup heading="Accounts">
                                                                {searchResults.accounts.map((a: any) => (
                                                                    <CommandItem key={a.id} onSelect={() => {
                                                                        setLinkedRecordId(a.id);
                                                                        setLinkedRecordType('account');
                                                                        setLinkedRecordName(a.name);
                                                                        setLinkSearchOpen(false);
                                                                    }}>
                                                                        <Building2 className="mr-2 h-4 w-4 text-blue-400" />
                                                                        {a.name}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        )}
                                                        {searchResults?.contacts?.length > 0 && (
                                                            <CommandGroup heading="Contacts">
                                                                {searchResults.contacts.map((c: any) => (
                                                                    <CommandItem key={c.id} onSelect={() => {
                                                                        setLinkedRecordId(c.id);
                                                                        setLinkedRecordType('contact');
                                                                        setLinkedRecordName(`${c.first_name || ""} ${c.last_name || ""}`);
                                                                        setLinkSearchOpen(false);
                                                                    }}>
                                                                        <Users className="mr-2 h-4 w-4 text-emerald-400" />
                                                                        {c.first_name} {c.last_name}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        )}
                                                        {searchResults?.leads?.length > 0 && (
                                                            <CommandGroup heading="Leads">
                                                                {searchResults.leads.map((l: any) => (
                                                                    <CommandItem key={l.id} onSelect={() => {
                                                                        setLinkedRecordId(l.id);
                                                                        setLinkedRecordType('lead');
                                                                        setLinkedRecordName(`${l.firstName || ""} ${l.lastName || ""}`);
                                                                        setLinkSearchOpen(false);
                                                                    }}>
                                                                        <Zap className="mr-2 h-4 w-4 text-amber-400" />
                                                                        {l.firstName} {l.lastName}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        )}
                                                    </>
                                                ) : null}
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" onClick={() => setQuickAddOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleQuickAdd} disabled={isSubmitting || !newTaskTitle.trim()} className="px-8 shadow-lg shadow-primary/20">
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Task"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Agenda View */}
            {view === "agenda" && (
                <div className="space-y-6">
                    {groupedAgendaEvents.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border rounded-xl bg-muted/20">
                            No tasks scheduled for {format(currentMonth, "MMMM yyyy")}
                        </div>
                    ) : (
                        groupedAgendaEvents.map((group) => {
                            const isDateToday = isToday(group.date);
                            return (
                                <div key={format(group.date, 'yyyy-MM-dd')} className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isDateToday ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                            }`}>
                                            {format(group.date, "EEEE, MMM d")}
                                            {isDateToday && " • Today"}
                                        </div>
                                        <div className="h-px bg-border flex-1" />
                                    </div>
                                    <div className="grid gap-2">
                                        {group.tasks.map((event) => (
                                            <Link
                                                key={event.id}
                                                href={`/campaigns/tasks/viewtask/${event.id}`}
                                                className={`flex items-center gap-4 p-3 rounded-xl border transition-all hover:shadow-md ${isDateToday ? "bg-primary/5 border-primary/20" : "bg-card hover:bg-muted/50"
                                                    }`}
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <StatusDot priority={event.priority} />
                                                        <span className="font-semibold">{event.title}</span>
                                                        <Badge variant={getPriorityBadgeVariant(event.priority || "normal") as any} className="text-[10px] h-4 px-1.5 ml-auto sm:ml-0">
                                                            {event.priority}
                                                        </Badge>
                                                    </div>
                                                    {event.projectTitle && (
                                                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                            <span className="opacity-70">Project:</span>
                                                            <span className="font-medium">{event.projectTitle}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-30 group-hover:opacity-100" />
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Month/Week Calendar Grid */}
            {(view === "month" || view === "week") && (
                <div className="rounded-xl border border-border/50 overflow-hidden bg-background/50">
                    {/* Week days header */}
                    <div className="grid grid-cols-7 bg-muted/50 border-b border-border/50">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                            <div
                                key={day}
                                className="p-3 text-center text-sm font-medium text-muted-foreground"
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days grid */}
                    <div className="grid grid-cols-7">
                        {viewDays.map((day, idx) => {
                            const dayEvents = getEventsForDay(day);
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const isCurrentDay = isToday(day);

                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleDayClick(day)}
                                    className={`min-h-[100px] border-b border-r border-border/30 p-2 cursor-pointer hover:bg-muted/30 transition-colors ${!isCurrentMonth && view === "month" ? "bg-muted/20 text-muted-foreground" : ""
                                        } ${isCurrentDay ? "bg-primary/5" : ""}`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <div
                                            className={`text-sm font-medium ${isCurrentDay
                                                ? "bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center"
                                                : ""
                                                }`}
                                        >
                                            {format(day, "d")}
                                        </div>
                                        <Plus className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="space-y-1">
                                        {dayEvents.slice(0, view === "week" ? 5 : 3).map((event) => (
                                            <Link
                                                key={event.id}
                                                href={`/campaigns/tasks/viewtask/${event.id}`}
                                                className="block"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="flex items-center gap-1.5 text-xs p-1 rounded bg-muted/60 hover:bg-muted transition-colors truncate">
                                                    <StatusDot priority={event.priority} size="sm" />
                                                    <span className="truncate">{event.title}</span>
                                                </div>
                                            </Link>
                                        ))}
                                        {dayEvents.length > (view === "week" ? 5 : 3) && (
                                            <div className="text-xs text-muted-foreground px-1">
                                                +{dayEvents.length - (view === "week" ? 5 : 3)} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                {Object.entries(priorityLabels)
                    .reverse()
                    .map(([key, label]) => (
                        <div key={key} className="flex items-center gap-2">
                            <StatusDot priority={key} size="md" />
                            <span>{label}</span>
                        </div>
                    ))}
                <div className="text-xs ml-auto">Click on any day to add a task</div>
            </div>
            {/* Today's Tasks Modal */}
            <Dialog open={todayTasksOpen} onOpenChange={setTodayTasksOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            Todays Agenda
                        </DialogTitle>
                        <DialogDescription>
                            {todayTasks.length > 0
                                ? `You have ${todayTasks.length} task${todayTasks.length === 1 ? '' : 's'} assigned to you or created by you for today.`
                                : "You're all caught up! No tasks found for you today."}
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-[60vh] mt-4 pr-4">
                        <div className="space-y-3">
                            {todayTasks.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground opacity-60">
                                    <CheckCircle2 className="h-12 w-12 mb-3" />
                                    <p>No tasks for today</p>
                                </div>
                            )}

                            {todayTasks.map((task) => (
                                <div key={task.id} className="group flex items-start justify-between gap-3 p-3 rounded-xl border bg-card/50 hover:bg-muted/50 transition-colors">
                                    <div className="space-y-1.5 overflow-hidden">
                                        <div className="flex items-center gap-2">
                                            <StatusDot priority={task.priority} />
                                            <span className="font-medium truncate block text-sm">{task.title}</span>
                                            <Badge variant={getPriorityBadgeVariant(task.priority || "normal") as any} className="text-[10px] h-5 px-1.5 capitalize">
                                                {task.priority}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            {task.projectTitle && (
                                                <span className="flex items-center gap-1">
                                                    {task.projectTitle}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="shrink-0 pt-0.5">
                                        <Link href={`/campaigns/tasks/viewtask/${task.id}`}>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}

