import * as React from "react";
import { cn } from "@/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  fullWidth?: boolean; // For backward compatibility (always full width now)
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, fullWidth, ...props }, ref) => {
    // fullWidth is deprecated but kept for backward compatibility (always full width now)
    return (
      <input
        type={type}
        className={cn(
          "glass-input w-full",
          "flex h-10 rounded-lg px-3 py-2 text-sm",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-[var(--color-text-muted)]",
          "focus:outline-none focus:border-[var(--color-violet-500)]",
          "focus:shadow-[0_0_0_3px_rgba(139,92,246,0.3),0_0_15px_rgba(139,92,246,0.2)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-2 border-red-500 focus:border-red-500",
          className,
        )}
        style={{ color: "var(--color-text-primary)" }}
        ref={ref}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export { Input };
