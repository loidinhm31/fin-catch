import React, { forwardRef } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
  error?: boolean;
  fullWidth?: boolean;
  placeholder?: string;
  children?: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      error = false,
      fullWidth = false,
      placeholder,
      className = "",
      children,
      ...props
    },
    ref,
  ) => {
    const widthStyle = fullWidth ? "w-full" : "";

    return (
      <div className={`relative ${widthStyle}`}>
        <select
          ref={ref}
          className={`glass-input ${widthStyle} ${error ? "border-2 border-red-500" : ""} ${className} pr-10 appearance-none cursor-pointer`}
          style={{ color: "var(--color-text-primary)" }}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options &&
            options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          {children}
        </select>
        <div
          className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3"
          style={{ color: "var(--color-text-primary)" }}
        >
          <svg
            className="fill-current h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    );
  },
);

Select.displayName = "Select";
