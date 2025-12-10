"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const { selected } = props as { selected?: any };
  // Identify start and end dates for custom styling
  const startEndModifiers = React.useMemo(() => {
    if (selected && typeof selected === 'object' && 'from' in selected) {
      return [selected.from, selected.to].filter(Boolean);
    }
    return [];
  }, [selected]);

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("py-4 px-10 sm:px-12 relative w-full flex justify-center", className)}
      modifiers={{ startEnd: startEndModifiers }}
      modifiersClassNames={{
        startEnd: "bg-transparent text-foreground !bg-transparent !text-foreground border-[3px] border-primary hover:!bg-transparent hover:!text-foreground focus:!bg-transparent focus:!text-foreground font-bold rounded-md flex items-center justify-center"
      }}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 items-center px-10",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "h-full w-8 p-0 absolute left-0 top-0 flex items-center justify-center transition-all rounded-none z-10 bg-accent text-accent-foreground dark:text-white hover:bg-transparent hover:border hover:border-accent"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "h-full w-8 p-0 absolute right-0 top-0 flex items-center justify-center transition-all rounded-none z-10 bg-accent text-accent-foreground dark:text-white hover:bg-transparent hover:border hover:border-accent"
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "text-muted-foreground rounded-md w-8 sm:w-9 font-normal text-[0.8rem] text-center",
        week: "flex w-full mt-2",
        day: "h-8 w-8 sm:h-9 sm:w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 sm:h-9 sm:w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        range_start: "day-range-start rounded-l-md",
        range_end: "day-range-end rounded-r-md",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-bold",
        today: "bg-accent text-accent-foreground",
        outside:
          "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        disabled: "text-muted-foreground opacity-50",
        range_middle:
          "aria-selected:!bg-transparent aria-selected:!text-muted-foreground !border-y !border-border !rounded-none !text-muted-foreground hover:!bg-transparent hover:!text-muted-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
