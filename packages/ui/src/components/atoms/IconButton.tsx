import React, { useState } from "react";
import { LucideIcon } from "lucide-react";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  variant?: "primary" | "secondary" | "danger" | "warning" | "info";
  size?: "sm" | "md" | "lg";
}

const variantStyles: Record<
  string,
  { bg: string; hoverBg: string; color: string }
> = {
  primary: {
    bg: "var(--color-action-edit-bg)",
    hoverBg: "var(--color-action-edit-hover)",
    color: "var(--color-action-edit-icon)",
  },
  secondary: {
    bg: "var(--color-action-expand-bg)",
    hoverBg: "var(--color-action-expand-hover)",
    color: "var(--color-action-expand-icon)",
  },
  danger: {
    bg: "var(--color-action-delete-bg)",
    hoverBg: "var(--color-action-delete-hover)",
    color: "var(--color-action-delete-icon)",
  },
  warning: {
    bg: "var(--color-alert-warning-bg)",
    hoverBg: "var(--color-alert-warning-bg)",
    color: "var(--color-amber-500)",
  },
  info: {
    bg: "var(--color-alert-info-bg)",
    hoverBg: "var(--color-action-edit-bg)",
    color: "var(--color-cyan-500)",
  },
};

const sizeStyles: Record<string, { button: string; icon: string }> = {
  sm: { button: "w-6 h-6", icon: "w-3 h-3" },
  md: { button: "w-8 h-8", icon: "w-4 h-4" },
  lg: { button: "w-10 h-10", icon: "w-5 h-5" },
};

export const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  variant = "secondary",
  size = "md",
  className = "",
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const variantStyle = variantStyles[variant] || variantStyles.secondary;
  const sizeClass = sizeStyles[size] || sizeStyles.md;

  return (
    <button
      className={`${sizeClass.button} rounded-full flex items-center justify-center transition-all ${className}`}
      style={{
        background: isHovered ? variantStyle.hoverBg : variantStyle.bg,
        color: variantStyle.color,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      <Icon className={sizeClass.icon} />
    </button>
  );
};
