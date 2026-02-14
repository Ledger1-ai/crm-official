"use client";

import { useState, useEffect } from "react";
import {
    Phone,
    StickyNote,
    CheckSquare,
    Users,
    ChevronUp,
    ChevronDown,
    X,
    Maximize2,
    Minimize2,
    ChevronRight,
    Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import DialerPanel from "@/app/(routes)/crm/dialer/DialerPanel";

export default function UtilityBar() {
    const [isMinimized, setIsMinimized] = useState(false);
    const [notes, setNotes] = useState("");
    const [tasks, setTasks] = useState<{ id: string, text: string, completed: boolean }[]>([]);
    const [isDialerOpen, setIsDialerOpen] = useState(false);

    useEffect(() => {
        const savedNotes = localStorage.getItem("crm-utility-notes");
        if (savedNotes) setNotes(savedNotes);

        const savedTasks = localStorage.getItem("crm-utility-tasks");
        if (savedTasks) setTasks(JSON.parse(savedTasks));
    }, []);

    const saveNotes = (val: string) => {
        setNotes(val);
        localStorage.setItem("crm-utility-notes", val);
    };

    const addTask = () => {
        const newTasks = [...tasks, { id: Math.random().toString(), text: "", completed: false }];
        setTasks(newTasks);
        localStorage.setItem("crm-utility-tasks", JSON.stringify(newTasks));
    };

    const updateTask = (id: string, text: string) => {
        const newTasks = tasks.map(t => t.id === id ? { ...t, text } : t);
        setTasks(newTasks);
        localStorage.setItem("crm-utility-tasks", JSON.stringify(newTasks));
    };

    const toggleTask = (id: string) => {
        const newTasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
        setTasks(newTasks);
        localStorage.setItem("crm-utility-tasks", JSON.stringify(newTasks));
    };

    const removeTask = (id: string) => {
        const newTasks = tasks.filter(t => t.id !== id);
        setTasks(newTasks);
        localStorage.setItem("crm-utility-tasks", JSON.stringify(newTasks));
    };

    return (
        <div className="relative shrink-0">
            {/* The Main Utility Bar */}
            <div className={cn(
                "w-full bg-background/80 backdrop-blur-md border-t border-border shadow-[0_-4px_12px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out",
                isMinimized ? "h-0 -translate-y-[-100%] opacity-0 overflow-hidden" : "h-12 translate-y-0 opacity-100"
            )}>
                <div className="max-w-screen-2xl mx-auto h-full flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsMinimized(true)}
                            className="h-8 w-8 p-0 hover:bg-muted"
                            title="Minimize Utility Bar"
                        >
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                        <div className="h-4 w-px bg-border mx-2" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden sm:inline">
                            Utility Bar
                        </span>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-4">
                        {/* Calendar */}
                        <Link href="/crm/calendar">
                            <Button variant="ghost" size="sm" className="gap-2 text-xs font-semibold hover:bg-blue-500/10 hover:text-blue-500 transition-all">
                                <Calendar className="h-4 w-4" />
                                <span className="hidden md:inline">Calendar</span>
                            </Button>
                        </Link>

                        <div className="h-4 w-px bg-border mx-1" />

                        {/* Notes Popover */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="gap-2 text-xs font-semibold hover:bg-amber-500/10 hover:text-amber-500 transition-all">
                                    <StickyNote className="h-4 w-4" />
                                    <span className="hidden md:inline">Quick Notes</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-4" side="top" align="center">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold text-sm">Scratchpad</h4>
                                    <StickyNote className="h-3 w-3 text-muted-foreground" />
                                </div>
                                <textarea
                                    className="w-full h-48 bg-muted/50 rounded-md p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary border-none"
                                    placeholder="Type something..."
                                    value={notes}
                                    onChange={(e) => saveNotes(e.target.value)}
                                />
                                <p className="text-[10px] text-muted-foreground mt-2 text-right">Auto-saves to local storage</p>
                            </PopoverContent>
                        </Popover>

                        <div className="h-4 w-px bg-border mx-1" />

                        {/* Tasks Popover */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="gap-2 text-xs font-semibold hover:bg-emerald-500/10 hover:text-emerald-500 transition-all">
                                    <CheckSquare className="h-4 w-4" />
                                    <span className="hidden md:inline">Checklist</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-4" side="top" align="center">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold text-sm">Quick Checklist</h4>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={addTask}>
                                        <span className="text-lg">+</span>
                                    </Button>
                                </div>
                                <div className="max-h-60 overflow-y-auto space-y-2">
                                    {tasks.length === 0 && (
                                        <p className="text-xs text-muted-foreground text-center py-4">No quick tasks.</p>
                                    )}
                                    {tasks.map((task) => (
                                        <div key={task.id} className="flex items-center gap-2 group">
                                            <input
                                                type="checkbox"
                                                checked={task.completed}
                                                onChange={() => toggleTask(task.id)}
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <input
                                                type="text"
                                                value={task.text}
                                                onChange={(e) => updateTask(task.id, e.target.value)}
                                                className={cn(
                                                    "flex-1 bg-transparent border-none text-sm p-0 focus:ring-0",
                                                    task.completed && "line-through text-muted-foreground"
                                                )}
                                                placeholder="What needs to be done?"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                                onClick={() => removeTask(task.id)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                {tasks.length > 0 && (
                                    <p className="text-[10px] text-muted-foreground mt-3 text-center italic border-t pt-2">
                                        Use this for ephemeral tasks. Sync to CRM for permanent tracking.
                                    </p>
                                )}
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex items-center gap-4">
                        <Popover open={isDialerOpen} onOpenChange={setIsDialerOpen}>
                            <PopoverTrigger asChild>
                                <div className={cn(
                                    "hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full transition-all cursor-pointer group",
                                    isDialerOpen
                                        ? "bg-emerald-500 text-white border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                        : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 hover:text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/50"
                                )}>
                                    <Phone className="h-3.5 w-3.5" />
                                    <span className="text-xs font-semibold">Numpad</span>
                                    <div className={cn("h-3 w-px mx-1", isDialerOpen ? "bg-white/20" : "bg-emerald-500/20")} />
                                    {isDialerOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-[320px] p-0 border-amber-500/20 bg-background/95 backdrop-blur-xl text-foreground shadow-2xl overflow-hidden shadow-amber-500/20" side="top" align="end" sideOffset={12}>
                                <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-white/5">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                        <span className="text-amber-500">:::</span>
                                        <span className="tracking-widest uppercase text-[9px]">Comm Terminal</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[8px] text-emerald-500 font-bold uppercase tracking-tight">Active</span>
                                    </div>
                                </div>
                                <div className="bg-black/20">
                                    <DialerPanel isCompact={true} />
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>

            {/* Floating Expand Button (Circle) */}
            <div className={cn(
                "absolute bottom-4 left-4 transition-all duration-500 z-[60]",
                isMinimized ? "translate-y-0 opacity-100 scale-100" : "translate-y-12 opacity-0 scale-50 pointer-events-none"
            )}>
                <button
                    onClick={() => setIsMinimized(false)}
                    className="w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all group border-2 border-background"
                    title="Expand Utility Bar"
                >
                    <ChevronUp className="h-5 w-5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
            </div>
        </div>
    );
}
