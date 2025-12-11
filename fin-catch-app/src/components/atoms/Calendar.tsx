import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/utils/cn";
import { buttonVariants } from "./Button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-semibold",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "h-7 w-7 bg-transparent p-0 opacity-80 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-[var(--color-text-muted)] rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          "[&:has([aria-selected])]:bg-[rgba(139,92,246,0.1)]",
          "[&:has([aria-selected].day-outside)]:bg-[rgba(139,92,246,0.05)]",
          "[&:has([aria-selected].day-range-end)]:rounded-r-md"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
          "hover:bg-[rgba(139,92,246,0.2)]",
          "focus:bg-[rgba(139,92,246,0.2)]"
        ),
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected: cn(
          "bg-gradient-to-r from-violet-500 to-violet-600",
          "text-white hover:bg-violet-600 hover:text-white",
          "focus:bg-violet-600 focus:text-white"
        ),
        day_today: cn(
          "bg-[rgba(34,211,238,0.2)] text-cyan-400",
          "border border-cyan-500/40"
        ),
        day_outside:
          "day-outside text-[var(--color-text-muted)] opacity-50 aria-selected:bg-[rgba(139,92,246,0.1)] aria-selected:opacity-30",
        day_disabled: "text-[var(--color-text-muted)] opacity-50",
        day_range_middle: cn(
          "aria-selected:bg-[rgba(139,92,246,0.1)]",
          "aria-selected:text-[var(--color-text-primary)]"
        ),
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "left") {
            return <ChevronLeft className="h-4 w-4" />;
          }
          return <ChevronRight className="h-4 w-4" />;
        },
      }}
      style={{
        color: "var(--color-text-primary)",
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
