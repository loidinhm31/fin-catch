import React, { forwardRef, useState, useRef } from "react";
import { format } from "date-fns";
import { formatDateWithOrdinal } from "../../utils/dateUtils";

export interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  value?: Date;
  onChange?: (date: Date | null) => void;
  error?: boolean;
  fullWidth?: boolean;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, onChange, error = false, fullWidth = false, className = "", ...props }, ref) => {
    const widthStyle = fullWidth ? "w-full" : "";
    const hiddenInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (newValue && onChange) {
        onChange(new Date(newValue));
      } else if (onChange) {
        onChange(null);
      }
    };

    const handleDisplayClick = () => {
      // Trigger the hidden date input
      hiddenInputRef.current?.showPicker();
    };

    // Display value in ordinal format
    const displayValue = value ? formatDateWithOrdinal(value) : "";

    // Value for the hidden datetime-local input
    const inputValue = value ? format(value, "yyyy-MM-dd'T'HH:mm") : "";

    return (
      <div className={`relative ${widthStyle}`}>
        {/* Display input with formatted date */}
        <input
          ref={ref}
          type="text"
          value={displayValue}
          onClick={handleDisplayClick}
          readOnly
          placeholder="Select a date"
          className={`glass-input ${widthStyle} ${error ? 'border-2 border-red-500' : ''} ${className} cursor-pointer`}
          style={{ color: 'var(--cube-gray-900)' }}
          {...props}
        />

        {/* Hidden datetime-local input for date picking */}
        <input
          ref={hiddenInputRef}
          type="datetime-local"
          value={inputValue}
          onChange={handleChange}
          className="absolute opacity-0 pointer-events-none"
          tabIndex={-1}
        />
      </div>
    );
  }
);

DateInput.displayName = "DateInput";
