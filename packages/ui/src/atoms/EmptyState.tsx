import React from "react";
import { Card } from "./Card";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
}) => {
  return (
    <Card className="p-12 text-center">
      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600">
        {icon}
      </div>
      <p className="text-gray-900 font-semibold mb-2">{title}</p>
      <p className="text-gray-500 text-sm">{description}</p>
    </Card>
  );
};
