import React from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "sm:max-w-md",
    md: "sm:max-w-lg",
    lg: "sm:max-w-2xl",
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4"
      onClick={(e) => {
        // Only close if clicking the backdrop, not the modal content
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={`bg-white w-full ${sizeClasses[size]} rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col`}>
        <div className="sticky top-0 bg-white z-10 px-6 pt-6 pb-4 border-b border-gray-100 flex justify-between items-center rounded-t-2xl sm:rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-6 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
