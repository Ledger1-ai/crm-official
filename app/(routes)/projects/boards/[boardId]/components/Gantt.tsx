"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { addDays, differenceInDays, format, isAfter, isBefore, isSameDay, max, min, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ZoomIn, ZoomOut, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import UpdateTaskDialog from "../../../dialogs/UpdateTask";
import { DateRangePicker } from "@/components/ui/date-range-picker";

// --- Types ---
interface TaskItem {
  id: string;
  title: string;
  createdAt?: string | Date | null;
  dueDateAt?: string | Date | null;
  taskStatus?: string | null;
  priority?: string;
  section?: string | null;
  assigned_user?: { id: string; name: string | null; avatar?: string | null } | null;
}

interface SectionItem {
  id: string;
  title: string;
  tasks: TaskItem[];
}

interface GanttProps {
  data: SectionItem[];
}

type Zoom = "day" | "week" | "month";

const dayWidthForZoom: Record<Zoom, number> = {
  day: 60,
  week: 40,
  month: 15,
};

const clamp = (n: number, minN: number, maxN: number) => Math.max(minN, Math.min(maxN, n));

export default function Gantt({ data }: GanttProps) {
  // --- State ---
  const [zoom, setZoom] = useState<Zoom>("week");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();
  const [editTask, setEditTask] = useState<TaskItem | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Data Processing ---
  const { rows, initialStart, initialEnd } = useMemo(() => {
    const rows: { sectionId: string; sectionTitle: string; tasks: (TaskItem & { start: Date; end: Date })[] }[] = [];
    let minStart: Date | null = null;
    let maxEnd: Date | null = null;

    for (const sec of data || []) {
      const rowTasks: (TaskItem & { start: Date; end: Date })[] = [];
      for (const t of sec.tasks || []) {
        const start = startOfDay(t.createdAt ? new Date(t.createdAt) : new Date());
        let end = t.dueDateAt ? startOfDay(new Date(t.dueDateAt as any)) : addDays(start, 1);
        if (isBefore(end, start)) end = addDays(start, 1);

        rowTasks.push({ ...t, start, end });
        minStart = minStart ? min([minStart, start]) : start;
        maxEnd = maxEnd ? max([maxEnd, end]) : end;
      }
      rows.push({ sectionId: sec.id, sectionTitle: sec.title, tasks: rowTasks });
    }

    return {
      rows,
      initialStart: minStart || new Date(),
      initialEnd: maxEnd || addDays(new Date(), 30)
    };
  }, [data]);

  // --- Initialization ---
  useEffect(() => {
    if (!dateRange && initialStart && initialEnd) {
      setDateRange({ from: addDays(initialStart, -7), to: addDays(initialEnd, 14) });
    }
  }, [initialStart, initialEnd, dateRange]);

  // --- Derived Values ---
  const startDate = useMemo(() => dateRange?.from || new Date(), [dateRange?.from]);
  const endDate = dateRange?.to || addDays(startDate, 30);
  const totalDays = Math.max(1, differenceInDays(endDate, startDate) + 1);
  const dayWidth = dayWidthForZoom[zoom];
  const gridWidth = totalDays * dayWidth;

  const headerDays = useMemo(() => Array.from({ length: totalDays }, (_, i) => addDays(startDate, i)), [startDate, totalDays]);

  // --- Handlers ---
  const handleZoomChange = (dir: 'in' | 'out') => {
    const levels: Zoom[] = ['month', 'week', 'day'];
    const idx = levels.indexOf(zoom);
    if (dir === 'in' && idx < levels.length - 1) setZoom(levels[idx + 1]);
    if (dir === 'out' && idx > 0) setZoom(levels[idx - 1]);
  };

  return (
    <div className="flex flex-col w-full h-full bg-background text-foreground font-sans selection:bg-primary/30">
      {/* --- Edit Sheet --- */}
      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        <SheetContent className="border-l border-border bg-background/90 backdrop-blur-xl">
          {editTask && (
            <UpdateTaskDialog
              users={[]}
              boards={[]}
              boardId=""
              initialData={editTask as any}
              onDone={() => setIsEditOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* --- Glass Toolbar --- */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/50 backdrop-blur-md z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent" onClick={() => handleZoomChange('out')}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs font-medium px-2 min-w-[60px] text-center uppercase tracking-wider text-muted-foreground">{zoom}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent" onClick={() => handleZoomChange('in')}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DateRangePicker
            date={dateRange}
            setDate={(range) => range?.from && setDateRange({ from: range.from, to: range.to || range.from })}
            className="bg-muted/50 border-border text-foreground hover:bg-accent hover:text-accent-foreground w-[240px]"
            popoverClassName="bg-popover border-border text-popover-foreground"
          />
        </div>
      </div>

      {/* --- Main Scroll Area --- */}
      <div className="flex-1 overflow-auto relative scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent" ref={containerRef}>

        {/* --- Sticky Header --- */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border shadow-sm">

          {/* Month Row */}
          <div className="flex border-b border-border h-10">
            {(() => {
              const months: { date: Date; width: number }[] = [];
              let current = startDate;
              while (current <= endDate) {
                const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1);
                const endOfMonth = addDays(nextMonth, -1);
                const actualEnd = min([endDate, endOfMonth]);
                const days = differenceInDays(actualEnd, max([startDate, current])) + 1;

                if (days > 0) months.push({ date: current, width: days * dayWidth });
                current = nextMonth;
              }
              return months.map((m, i) => (
                <div key={i} className="flex-none flex items-center px-4 text-xs font-bold tracking-widest text-muted-foreground uppercase border-r border-border bg-muted/20" style={{ width: m.width }}>
                  {format(m.date, "MMMM yyyy")}
                </div>
              ));
            })()}
          </div>

          {/* Day Row */}
          <div className="flex h-12">
            {headerDays.map((d, i) => {
              const isToday = isSameDay(d, new Date());
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              return (
                <div key={i}
                  className={cn(
                    "flex-none flex flex-col items-center justify-center border-r border-border text-[10px] uppercase tracking-wider transition-colors",
                    isToday ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground",
                    isWeekend && !isToday && "bg-muted/20"
                  )}
                  style={{ width: dayWidth }}
                >
                  <span className="opacity-60">{format(d, "EEE")}</span>
                  <span className="text-sm">{format(d, "d")}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- Gantt Body --- */}
        <div className="relative min-h-[500px]">
          {/* Grid Background Lines */}
          <div className="absolute inset-0 flex pointer-events-none z-0">
            {headerDays.map((d, i) => {
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              return (
                <div key={i}
                  className={cn(
                    "flex-none h-full border-r border-border/50",
                    isWeekend && "bg-muted/10"
                  )}
                  style={{ width: dayWidth }}
                />
              )
            })}
          </div>

          {/* Today Line */}
          <div className="absolute top-0 bottom-0 z-10 pointer-events-none"
            style={{ left: differenceInDays(new Date(), startDate) * dayWidth + (dayWidth / 2) }}>
            <div className="h-full w-[1px] bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
          </div>

          {/* Rows */}
          <div className="relative z-10">
            {rows.map((row) => (
              <div key={row.sectionId} className="group/section mb-8">
                {/* Section Header */}
                <div className="sticky left-0 z-20 px-4 py-2 bg-background/90 backdrop-blur-md border-y border-border flex items-center gap-3 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                  <h3 className="text-sm font-semibold text-foreground tracking-tight">{row.sectionTitle}</h3>
                  <Badge variant="outline" className="border-border text-muted-foreground text-[10px] h-5">{row.tasks.length}</Badge>
                </div>

                {/* Task Rows */}
                <div className="pt-2 pb-4">
                  {row.tasks.map((t, idx) => {
                    const startOffset = differenceInDays(t.start, startDate);
                    const duration = differenceInDays(t.end, t.start) + 1;

                    if (startOffset + duration < 0 || startOffset > totalDays) return null;

                    const x = Math.max(0, startOffset * dayWidth);
                    const w = Math.min(gridWidth - x, duration * dayWidth);

                    // Styling based on status/priority
                    const isOverdue = t.taskStatus !== "COMPLETE" && isAfter(new Date(), t.end);
                    const isComplete = t.taskStatus === "COMPLETE";

                    let barClass = "from-zinc-700 to-zinc-800 border-zinc-600"; // Fallback
                    if (isComplete) barClass = "from-emerald-600 to-emerald-700 border-emerald-500 text-white shadow-emerald-900/20";
                    else if (isOverdue) barClass = "from-red-600 to-red-700 border-red-500 text-white shadow-red-900/20";
                    else if (t.priority === "High") barClass = "from-amber-600 to-amber-700 border-amber-500 text-white shadow-amber-900/20";
                    else barClass = "from-blue-600 to-blue-700 border-blue-500 text-white shadow-blue-900/20";

                    // Dark mode adjustments could be handled via CSS variables or dark: modifiers if needed, 
                    // but gradients usually need specific colors. For now, keeping these vibrant colors which work in both modes,
                    // or we could use `bg-primary` etc.
                    // Let's stick to the vibrant gradients but ensure text is readable (white).

                    return (
                      <div key={t.id} className="relative h-10 hover:bg-muted/30 transition-colors group/row">
                        <div
                          className={cn(
                            "absolute top-1.5 h-7 rounded-md shadow-sm border backdrop-blur-md bg-gradient-to-b flex items-center px-3 gap-2 cursor-pointer transition-all hover:scale-[1.01] hover:brightness-110 hover:z-20 hover:shadow-md",
                            barClass
                          )}
                          style={{ left: x + 4, width: w - 8 }}
                          onClick={() => { setEditTask(t); setIsEditOpen(true); }}
                        >
                          {/* Progress/Status Indicator */}
                          <div className={cn("w-1.5 h-1.5 rounded-full", isComplete ? "bg-emerald-200 shadow-[0_0_4px_rgba(52,211,153,0.8)]" : "bg-white/40")} />

                          <span className="text-xs font-medium truncate drop-shadow-sm text-white">{t.title}</span>

                          {t.assigned_user?.avatar && (
                            <img src={t.assigned_user.avatar} className="w-4 h-4 rounded-full ml-auto ring-1 ring-white/20" alt="" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
