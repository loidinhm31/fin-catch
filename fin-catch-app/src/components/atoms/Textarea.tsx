import React from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({ error, className = "", ...props }) => {
  return (
    <textarea
      className={`w-full px-3 py-3 bg-white border ${
        error ? "border-red-500" : "border-gray-300"
      } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none text-gray-900 placeholder:text-gray-400 ${className}`}
      {...props}
    />
  );
};
