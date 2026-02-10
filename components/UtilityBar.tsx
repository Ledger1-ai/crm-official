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
    Minimize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export default function UtilityBar() {
    const [isMinimized, setIsMinimized] = useState(false);
    const [notes, setNotes] = useState("");
    const [tasks, setTasks] = useState<{ id: string, text: string, completed: boolean }[]>([]);

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
        <div className={cn(
            "w-full z-50 bg-background/80 backdrop-blur-md border-t border-border shadow-[0_-4px_12px_rgba(0,0,0,0.1)] transition-all duration-300",
            isMinimized ? "h-10" : "h-12"
        )}>
            <div className="max-w-screen-2xl mx-auto h-full flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="h-8 w-8 p-0"
                    >
                        {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    <div className="h-4 w-px bg-border mx-2" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden sm:inline">
                        Utility Bar
                    </span>
                </div>

                <div className="flex items-center gap-1 sm:gap-4">
                    {/* Leads Manager */}
                    <Link href="/crm/leads">
                        <Button variant="ghost" size="sm" className="gap-2 text-xs font-semibold hover:bg-primary/10 hover:text-primary transition-all">
                            <Users className="h-4 w-4" />
                            <span className="hidden md:inline">Leads Manager</span>
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
                    <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md border text-[10px] font-mono">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        SYSTEM READY
                    </div>
                </div>
            </div>
        </div>
    );
}
