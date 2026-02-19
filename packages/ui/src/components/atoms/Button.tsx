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
          "bg-(--color-cyan-500) hover:bg-(--color-cyan-600) text-[#0F172A] shadow-[0_0_10px_rgba(6,182,212,0.4),0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_15px_rgba(6,182,212,0.4),0_0_30px_rgba(6,182,212,0.2),0_8px_32px_rgba(0,0,0,0.5)] focus-visible:ring-(--color-cyan-500) border border-[rgba(6,182,212,0.4)]",
        secondary:
          "bg-(--color-green-500) hover:bg-(--color-green-600) text-white shadow-[0_0_10px_rgba(16,185,129,0.5),0_0_20px_rgba(16,185,129,0.3)] hover:shadow-xl focus-visible:ring-(--color-green-500)",
        outline:
          "border-2 border-(--color-cyan-500) text-(--color-text-primary) hover:bg-[rgba(6,182,212,0.1)] hover:border-(--color-cyan-600) focus-visible:ring-(--color-cyan-500) bg-transparent backdrop-blur-md",
        ghost:
          "text-(--color-text-primary) hover:bg-(--glass-bg-dark) focus-visible:ring-(--color-cyan-500)",
        destructive:
          "bg-(--color-red-600) hover:bg-(--color-red-700) text-white shadow-[0_0_10px_rgba(220,38,38,0.6),0_0_20px_rgba(220,38,38,0.3)] hover:shadow-xl focus-visible:ring-(--color-red-600)",
        link: "text-(--color-cyan-500) underline-offset-4 hover:underline",
        cyber:
          "bg-transparent border-2 border-(--color-cyan-500) text-(--color-cyan-500) hover:bg-[rgba(6,182,212,0.1)] hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] font-mono uppercase tracking-wide text-xs backdrop-blur-md",
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
