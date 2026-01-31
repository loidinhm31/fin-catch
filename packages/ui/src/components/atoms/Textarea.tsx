import React from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  error,
  className = "",
  ...props
}) => {
  return (
    <textarea
      className={`glass-input w-full resize-none ${error ? "border-2 border-red-500" : ""} ${className}`}
      style={{ color: "var(--color-text-primary)" }}
      {...props}
    />
  );
};
