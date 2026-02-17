import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@fin-catch/shared";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--glass-bg-dark)] border border-[var(--glass-border-medium)] text-[var(--color-text-primary)] backdrop-blur-sm",
        primary:
          "bg-[rgba(6,182,212,0.2)] border border-[rgba(6,182,212,0.4)] text-[#06B6D4] shadow-[0_0_10px_rgba(6,182,212,0.3)]",
        secondary:
          "bg-[rgba(168,85,247,0.2)] border border-[rgba(168,85,247,0.4)] text-[#A855F7] shadow-[0_0_10px_rgba(168,85,247,0.3)]",
        success:
          "bg-[rgba(16,185,129,0.2)] border border-[rgba(16,185,129,0.4)] text-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.4)]",
        destructive:
          "bg-[rgba(220,38,38,0.2)] border border-[rgba(220,38,38,0.4)] text-[#DC2626] shadow-[0_0_10px_rgba(220,38,38,0.4)]",
        warning:
          "bg-[rgba(250,204,21,0.2)] border border-[rgba(250,204,21,0.4)] text-[#FACC15] shadow-[0_0_10px_rgba(250,204,21,0.3)]",
        outline:
          "text-[var(--color-text-primary)] border border-[var(--glass-border-medium)] bg-transparent",
        cyber:
          "bg-transparent border border-[#06B6D4] text-[#06B6D4] font-mono uppercase tracking-wide",
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
