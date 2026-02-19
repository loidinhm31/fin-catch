import React from "react";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  error?: boolean;
}

export const Label = React.memo(function Label({
  children,
  required = false,
  error = false,
  className = "",
  ...props
}: LabelProps) {
  return (
    <label
      className={className}
      style={{
        display: "block",
        fontSize: "var(--text-sm)",
        fontWeight: "var(--font-bold)",
        marginBottom: "var(--space-2)",
        color: error ? "var(--color-red-500)" : "var(--color-text-primary)",
      }}
      {...props}
    >
      {children}
      {required && (
        <span
          style={{
            color: "var(--color-red-500)",
            marginLeft: "var(--space-1)",
          }}
        >
          *
        </span>
      )}
    </label>
  );
});

Label.displayName = "Label";
