import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "blue" | "amber" | "green" | "red" | "gray";
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = "gray" }) => {
  const variantClasses = {
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    gray: "bg-gray-100 text-gray-700",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${variantClasses[variant]}`}>
      {children}
    </span>
  );
};
