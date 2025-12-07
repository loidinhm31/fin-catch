import React, {forwardRef, useRef, useEffect} from "react";
import {format} from "date-fns";
import {formatDateWithOrdinal} from "../../utils/dateUtils";

export interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  value?: Date;
  onChange?: (date: Date | null) => void;
  error?: boolean;
  fullWidth?: boolean;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, onChange, error = false, fullWidth = false, className = "", ...props }, ref) => {
    const widthStyle = fullWidth ? "w-full" : "";
    const dateInputRef = useRef<HTMLInputElement>(null);
    const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      if (newValue && onChange) {
        onChange(new Date(newValue));
      } else if (onChange) {
        onChange(null);
      }

      // Clear any existing timer
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }

      // Force blur to close picker after date selection
      closeTimerRef.current = setTimeout(() => {
        if (dateInputRef.current) {
          dateInputRef.current.blur();
        }
      }, 150);
    };

    const handleClick = () => {
      // Open the date picker when clicking on the display
      if (dateInputRef.current) {
        dateInputRef.current.focus();
        dateInputRef.current.showPicker?.();
      }
    };

    const handleBlur = () => {
      // Clean up timer on blur
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };

    // Cleanup timer on unmount
    useEffect(() => {
      return () => {
        if (closeTimerRef.current) {
          clearTimeout(closeTimerRef.current);
        }
      };
    }, []);

    // Display value in ordinal format
    const displayValue = value ? formatDateWithOrdinal(value) : "";

    // Value for the date input
    const inputValue = value ? format(value, "yyyy-MM-dd") : "";

    return (
      <div className={`relative ${widthStyle}`}>
        {/* Display input with formatted date */}
        <input
          ref={ref}
          type="text"
          value={displayValue}
          onClick={handleClick}
          readOnly
          placeholder="Select a date"
          className={`glass-input ${widthStyle} ${error ? 'border-2 border-red-500' : ''} ${className} cursor-pointer`}
          style={{ color: 'var(--cube-gray-900)' }}
          {...props}
        />

        {/* Hidden date input - positioned off-screen but functional */}
        <input
          ref={dateInputRef}
          type="date"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className="absolute"
          style={{
            left: '-9999px',
            position: 'absolute',
            colorScheme: 'light',
            color: '#111827'
          }}
          tabIndex={-1}
        />
      </div>
    );
  }
);

DateInput.displayName = "DateInput";
