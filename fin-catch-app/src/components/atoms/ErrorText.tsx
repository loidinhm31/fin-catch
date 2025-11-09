import React from "react";

export interface ErrorTextProps {
  children: React.ReactNode;
  className?: string;
}

export const ErrorText: React.FC<ErrorTextProps> = ({ children, className = "" }) => {
  if (!children) return null;

  return (
    <p
      className={className}
      style={{
        fontSize: 'var(--text-sm)',
        color: '#dc2626',
        fontWeight: 'var(--font-medium)',
        marginTop: 'var(--space-1)'
      }}
    >
      {children}
    </p>
  );
};
