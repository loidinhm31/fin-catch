import * as React from "react";
import { DatePicker } from "./DatePicker";

export interface DateInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange"
> {
  value?: Date;
  onChange?: (date: Date | null) => void;
  error?: boolean;
  fullWidth?: boolean; // Deprecated but kept for backward compatibility
}

/**
 * Backward-compatible DateInput wrapper
 * Now uses the new DatePicker component with Calendar internally
 */
export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      value,
      onChange,
      error = false,
      fullWidth: _fullWidth, // Ignored (always full width now)
      className = "",
      placeholder = "Select a date",
      disabled,
      id,
      name,
    },
    _ref
  ) => {
    const handleDateChange = (date: Date | undefined) => {
      onChange?.(date || null);
    };

    return (
      <div className="w-full">
        <DatePicker
          date={value || undefined}
          onDateChange={handleDateChange}
          placeholder={placeholder}
          disabled={disabled}
          error={error}
          className={className}
          id={id}
          name={name}
        />
      </div>
    );
  }
);

DateInput.displayName = "DateInput";
