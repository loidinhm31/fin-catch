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
      className="fixed inset-0 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={(e) => {
        // Only close if clicking the backdrop, not the modal content
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full ${sizeClasses[size]} rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-hidden flex flex-col glass-container`}
        style={{
          background: 'var(--glass-bg-dark-strong)',
          backdropFilter: 'var(--blur-xl)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <div
          className="sticky top-0 z-10 px-6 pt-6 pb-4 flex justify-between items-center rounded-t-2xl sm:rounded-t-2xl"
          style={{
            background: 'var(--glass-bg-dark-strong)',
            borderBottom: '1px solid var(--glass-border-medium)',
          }}
        >
          <h2
            className="text-2xl font-bold"
            style={{
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'var(--color-text-primary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
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
