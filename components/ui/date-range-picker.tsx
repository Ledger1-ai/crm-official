"use client"

import * as React from "react"
import { CalendarIcon } from "@radix-ui/react-icons"
import { addDays, format } from "date-fns"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle,
} from "@/components/ui/dialog"
import { useIsMobile } from "@/hooks/use-is-mobile"

interface DateRangePickerProps {
    className?: string
    popoverClassName?: string
    date: DateRange | undefined
    setDate: (date: DateRange | undefined) => void
}

export function DateRangePicker({
    className,
    popoverClassName,
    date,
    setDate,
}: DateRangePickerProps) {
    const [activeSelector, setActiveSelector] = React.useState<'from' | 'to'>('from');
    const isMobile = useIsMobile();
    const [open, setOpen] = React.useState(false);

    const handleSelect = (range: DateRange | undefined, selectedDay: Date) => {
        if (!date) {
            setDate({ from: selectedDay, to: undefined });
            setActiveSelector('to');
            return;
        }

        let newRange = { ...date };

        if (activeSelector === 'from') {
            if (date.to && selectedDay > date.to) {
                newRange = { from: selectedDay, to: undefined };
                setActiveSelector('to');
            } else {
                newRange = { ...date, from: selectedDay };
                setActiveSelector('to');
            }
        } else {
            if (date.from && selectedDay < date.from) {
                newRange = { from: selectedDay, to: date.from };
                setActiveSelector('from');
            } else {
                newRange = { ...date, to: selectedDay };
                setActiveSelector('from');
            }
        }

        setDate(newRange);
    };

    const TriggerButton = (
        <Button
            id="date"
            variant={"outline"}
            className={cn(
                "w-[260px] justify-start text-left font-normal",
                !date && "text-muted-foreground",
                className
            )}
        >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
                date.to ? (
                    <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                    </>
                ) : (
                    format(date.from, "LLL dd, y")
                )
            ) : (
                <span>Pick a date</span>
            )}
        </Button>
    );

    const CalendarContent = (
        <div className="flex flex-col h-full w-full">
            <div className={cn("flex items-center gap-2 p-3 border-b border-white/10", isMobile && "pr-10")}>
                <button
                    onClick={() => setActiveSelector('from')}
                    className={cn(
                        "text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded transition-colors",
                        activeSelector === 'from'
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                >
                    Start Date
                </button>
                <button
                    onClick={() => setActiveSelector('to')}
                    className={cn(
                        "text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded transition-colors",
                        activeSelector === 'to'
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                >
                    End Date
                </button>
                <span className="ml-auto text-[10px] text-muted-foreground">
                    {activeSelector === 'from' ? 'Select start date' : 'Select end date'}
                </span>
            </div>
            <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={handleSelect as any}
                numberOfMonths={2}
            />
        </div>
    );

    if (isMobile) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {TriggerButton}
                </DialogTrigger>
                <DialogContent className={cn("w-auto p-0 bg-zinc-950 border-white/10 max-w-[95vw]", popoverClassName)}>
                    <DialogTitle className="sr-only">Select Date Range</DialogTitle>
                    {CalendarContent}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {TriggerButton}
            </PopoverTrigger>
            <PopoverContent className={cn("w-auto p-0 flex flex-col", popoverClassName)} align="end">
                {CalendarContent}
            </PopoverContent>
        </Popover>
    )
}
