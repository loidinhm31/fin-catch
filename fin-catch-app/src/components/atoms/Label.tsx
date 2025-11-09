import React from "react";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  error?: boolean;
}

export const Label: React.FC<LabelProps> = ({
  children,
  required = false,
  error = false,
  className = "",
  ...props
}) => {
  return (
    <label
      className={className}
      style={{
        display: 'block',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-bold)',
        marginBottom: 'var(--space-2)',
        color: error ? '#dc2626' : 'var(--cube-gray-900)'
      }}
      {...props}
    >
      {children}
      {required && <span style={{ color: '#dc2626', marginLeft: 'var(--space-1)' }}>*</span>}
    </label>
  );
};
