import React from "react";
import {ErrorText, Label} from "../atoms";

export interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required = false,
  children,
  htmlFor,
  className = "",
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label htmlFor={htmlFor} required={required} error={!!error}>
        {label}
      </Label>
      {children}
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
};
