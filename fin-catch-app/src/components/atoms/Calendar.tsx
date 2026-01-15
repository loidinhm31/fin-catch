"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { cn } from "@/utils/cn";
import { buttonVariants } from "./Button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 [--rdp-cell-size:2.25rem]", className)}
      classNames={{
        months: cn(
          "relative flex flex-col gap-4 sm:flex-row",
          defaultClassNames.months,
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        month_caption: cn(
          "flex h-8 w-full items-center justify-center relative px-8",
          defaultClassNames.month_caption,
        ),
        caption_label: cn(
          "text-sm font-semibold text-[var(--color-text-primary)]",
          defaultClassNames.caption_label,
        ),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between h-8 px-1",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "h-7 w-7 bg-transparent p-0 opacity-80 hover:opacity-100 text-[var(--color-text-primary)] z-10",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "h-7 w-7 bg-transparent p-0 opacity-80 hover:opacity-100 text-[var(--color-text-primary)] z-10",
          defaultClassNames.button_next,
        ),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-[var(--color-text-secondary)] flex-1 select-none text-center text-[0.8rem] font-medium",
          defaultClassNames.weekday,
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        day: cn(
          "relative aspect-square h-full w-full flex-1 select-none p-0 text-center text-sm",
          "hover:bg-[rgba(139,92,246,0.2)] hover:text-[var(--color-text-primary)] rounded-md",
          "focus:bg-[rgba(139,92,246,0.2)] focus:text-[var(--color-text-primary)]",
          "aria-selected:bg-gradient-to-r aria-selected:from-violet-500 aria-selected:to-violet-600",
          "aria-selected:text-white aria-selected:hover:bg-violet-600",
          defaultClassNames.day,
        ),
        day_button: cn(
          "h-[--rdp-cell-size] w-[--rdp-cell-size] p-0 font-normal text-[var(--color-text-primary)]",
          "cursor-pointer",
          buttonVariants({ variant: "ghost" }),
        ),
        selected: cn(
          "bg-gradient-to-r from-violet-500 to-violet-600",
          "text-white hover:bg-violet-600 hover:text-white",
          "focus:bg-violet-600 focus:text-white",
          defaultClassNames.selected,
        ),
        today: cn(
          "bg-[rgba(34,211,238,0.2)] text-cyan-400 font-semibold",
          "border border-cyan-500/40",
          defaultClassNames.today,
        ),
        outside: cn(
          "text-[var(--color-text-muted)] opacity-50",
          "aria-selected:bg-[rgba(139,92,246,0.1)] aria-selected:opacity-30",
          defaultClassNames.outside,
        ),
        disabled: cn(
          "text-[var(--color-text-muted)] opacity-50",
          defaultClassNames.disabled,
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
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
