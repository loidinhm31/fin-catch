import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./Select";
import type { SelectOption } from "./SimpleSelect";

export interface SelectOptionGroup {
  groupLabel: string;
  options: SelectOption[];
}

export interface GroupedSelectProps {
  groups: SelectOptionGroup[];
  value?: string;
  onValueChange?: (value: string) => void;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  error?: boolean;
  fullWidth?: boolean;
  onBlur?: () => void;
}

/**
 * Select component with grouped options using Radix UI SelectGroup and SelectLabel
 */
export const GroupedSelect = React.forwardRef<
  HTMLButtonElement,
  GroupedSelectProps
>(
  (
    {
      groups,
      value,
      onValueChange,
      onChange,
      placeholder = "Select an option",
      disabled = false,
      id,
      name,
      className,
      error: _error,
      fullWidth: _fullWidth,
      onBlur,
    },
    ref,
  ) => {
    const handleValueChange = (newValue: string) => {
      onValueChange?.(newValue);
      onChange?.(newValue);
    };

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
          {groups.map((group) => (
            <SelectGroup key={group.groupLabel}>
              <SelectLabel>{group.groupLabel}</SelectLabel>
              {group.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    );
  },
);

GroupedSelect.displayName = "GroupedSelect";
