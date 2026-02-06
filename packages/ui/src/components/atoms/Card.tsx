import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card = React.memo(function Card({
  children,
  className = "",
  onClick,
}: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 dark:border-gray-700 rounded-xl border border-gray-200 shadow-sm ${onClick ? "cursor-pointer" : ""} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
});

Card.displayName = "Card";
