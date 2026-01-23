import React from "react";
import { LucideIcon } from "lucide-react";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  variant?: "primary" | "secondary" | "danger" | "warning" | "info";
  size?: "sm" | "md" | "lg";
}

const variantStyles: Record<string, string> = {
  primary: "bg-blue-100 hover:bg-blue-200 text-blue-600",
  secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700",
  danger: "bg-red-100 hover:bg-red-200 text-red-600",
  warning: "bg-yellow-100 hover:bg-yellow-200 text-yellow-600",
  info: "bg-cyan-100 hover:bg-cyan-200 text-cyan-600",
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
  const variantClass = variantStyles[variant] || variantStyles.secondary;
  const sizeClass = sizeStyles[size] || sizeStyles.md;

  return (
    <button
      className={`${sizeClass.button} rounded-full flex items-center justify-center transition-all ${variantClass} ${className}`}
      {...props}
    >
      <Icon className={sizeClass.icon} />
    </button>
  );
};
