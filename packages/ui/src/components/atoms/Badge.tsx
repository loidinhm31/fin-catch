import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@fin-catch/shared";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-(--glass-bg-dark) border border-(--glass-border-medium) text-(--color-text-primary) backdrop-blur-sm",
        primary:
          "bg-[rgba(6,182,212,0.2)] border border-[rgba(6,182,212,0.4)] text-(--color-cyan-500) shadow-[0_0_10px_rgba(6,182,212,0.3)]",
        secondary:
          "bg-[rgba(168,85,247,0.2)] border border-[rgba(168,85,247,0.4)] text-(--color-violet-500) shadow-[0_0_10px_rgba(168,85,247,0.3)]",
        success:
          "bg-[rgba(16,185,129,0.2)] border border-[rgba(16,185,129,0.4)] text-(--color-green-500) shadow-[0_0_10px_rgba(16,185,129,0.4)]",
        destructive:
          "bg-[rgba(220,38,38,0.2)] border border-[rgba(220,38,38,0.4)] text-(--color-red-600) shadow-[0_0_10px_rgba(220,38,38,0.4)]",
        warning:
          "bg-[rgba(250,204,21,0.2)] border border-[rgba(250,204,21,0.4)] text-(--color-amber-400) shadow-[0_0_10px_rgba(250,204,21,0.3)]",
        outline:
          "text-(--color-text-primary) border border-(--glass-border-medium) bg-transparent",
        cyber:
          "bg-transparent border border-(--color-cyan-500) text-(--color-cyan-500) font-mono uppercase tracking-wide",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.memo(function Badge({
  className,
  variant,
  ...props
}: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
});

Badge.displayName = "Badge";

export { Badge, badgeVariants };
