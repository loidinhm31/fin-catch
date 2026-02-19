import * as React from "react";
import { cn } from "@fin-catch/shared";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  fullWidth?: boolean; // For backward compatibility (always full width now)
  monospace?: boolean; // For data inputs (prices, quantities, etc.)
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, fullWidth, monospace, ...props }, ref) => {
    // fullWidth is deprecated but kept for backward compatibility (always full width now)
    return (
      <input
        type={type}
        className={cn(
          "glass-input w-full",
          "flex h-10 rounded-lg px-3 py-2 text-sm",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-(--color-text-muted)",
          "focus:outline-none focus:border-(--color-cyan-500)",
          "focus:ring-(--color-cyan-500)/30 focus:shadow-[0_0_15px_rgba(6,182,212,0.4)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-all duration-200",
          error && "border-2 border-red-500 focus:border-red-500",
          monospace && "font-mono cyber-data",
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
