import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@repo/shared";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--glass-bg-dark)] border border-[var(--glass-border-medium)] text-[var(--color-text-primary)] backdrop-blur-sm",
        primary:
          "bg-violet-900/30 border border-violet-500/40 text-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.2)]",
        secondary:
          "bg-cyan-900/30 border border-cyan-500/40 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]",
        success:
          "bg-green-900/30 border border-green-500/40 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]",
        destructive:
          "bg-red-900/30 border border-red-500/40 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]",
        warning:
          "bg-amber-900/30 border border-amber-500/40 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]",
        outline:
          "text-[var(--color-text-primary)] border border-[var(--glass-border-medium)] bg-transparent",
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

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
