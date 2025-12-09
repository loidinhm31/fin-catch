import React, { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error = false, fullWidth = false, className = "", ...props }, ref) => {
    const widthStyle = fullWidth ? "w-full" : "";

    return (
      <input
        ref={ref}
        className={`glass-input ${widthStyle} ${error ? "border-2 border-red-500" : ""} ${className}`}
        style={{ color: "var(--color-text-primary)" }}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
