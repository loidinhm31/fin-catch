import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SimpleSelectProps {
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  /** @deprecated Use composition pattern with Select components for error styling */
  error?: boolean;
  /** @deprecated Select is now always full width by default */
  fullWidth?: boolean;
  onBlur?: () => void;
}

/**
 * Backward-compatible Select wrapper that uses the new shadcn composition pattern internally
 * This component maintains the old API while using the refactored Select components
 */
export const SimpleSelect = React.forwardRef<
  HTMLButtonElement,
  SimpleSelectProps
>(
  (
    {
      options,
      value,
      onValueChange,
      onChange,
      placeholder = "Select an option",
      disabled = false,
      id,
      name,
      className,
      error: _error, // Accepted for backward compatibility but not used
      fullWidth: _fullWidth, // Accepted for backward compatibility but not used
      onBlur,
    },
    ref,
  ) => {
    // Support both onValueChange and onChange callbacks
    const handleValueChange = (newValue: string) => {
      onValueChange?.(newValue);
      onChange?.(newValue);
    };

    // Note: error and fullWidth props are accepted for backward compatibility
    // but not actively used in the new composition pattern

    return (
      <Select
        value={value}
        onValueChange={handleValueChange}
        disabled={disabled}
        name={name}
      >
        <SelectTrigger ref={ref} id={id} onBlur={onBlur} className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  },
);

SimpleSelect.displayName = "SimpleSelect";
