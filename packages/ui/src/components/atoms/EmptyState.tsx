import React from "react";
import { Card } from "./Card";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const EmptyState = React.memo(function EmptyState({
  icon,
  title,
  description,
}: EmptyStateProps) {
  return (
    <Card className="p-12 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{
          backgroundColor: "var(--color-nav-portfolio-bg)",
          color: "var(--color-nav-portfolio-active)",
        }}
      >
        {icon}
      </div>
      <p
        className="font-semibold mb-2"
        style={{ color: "var(--color-text-primary)" }}
      >
        {title}
      </p>
      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
        {description}
      </p>
    </Card>
  );
});

EmptyState.displayName = "EmptyState";
