import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@fin-catch/shared";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap",
  {
    variants: {
      variant: {
        primary:
          "bg-[#06B6D4] hover:bg-[#0891B2] text-[#0F172A] shadow-[0_0_10px_rgba(6,182,212,0.4),0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_15px_rgba(6,182,212,0.4),0_0_30px_rgba(6,182,212,0.2),0_8px_32px_rgba(0,0,0,0.5)] focus-visible:ring-[#06B6D4] border border-[rgba(6,182,212,0.4)]",
        secondary:
          "bg-[#10B981] hover:bg-[#059669] text-white shadow-[0_0_10px_rgba(16,185,129,0.5),0_0_20px_rgba(16,185,129,0.3)] hover:shadow-xl focus-visible:ring-[#10B981]",
        outline:
          "border-2 border-[#06B6D4] text-[var(--color-text-primary)] hover:bg-[rgba(6,182,212,0.1)] hover:border-[#0891B2] focus-visible:ring-[#06B6D4] bg-transparent backdrop-blur-md",
        ghost:
          "text-[var(--color-text-primary)] hover:bg-[var(--glass-bg-dark)] focus-visible:ring-[#06B6D4]",
        destructive:
          "bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-[0_0_10px_rgba(220,38,38,0.6),0_0_20px_rgba(220,38,38,0.3)] hover:shadow-xl focus-visible:ring-[#DC2626]",
        link: "text-[#06B6D4] underline-offset-4 hover:underline",
        cyber:
          "bg-transparent border-2 border-[#06B6D4] text-[#06B6D4] hover:bg-[rgba(6,182,212,0.1)] hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] font-mono uppercase tracking-wide text-xs backdrop-blur-md",
      },
      size: {
        sm: "h-9 px-3 py-2 text-sm",
        md: "h-10 px-4 py-2 text-base",
        lg: "h-12 px-6 py-3 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, isLoading, disabled, children, ...props },
    ref,
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
