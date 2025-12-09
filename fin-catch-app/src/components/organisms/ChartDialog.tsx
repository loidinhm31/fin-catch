import React from "react";
import { X, Maximize2 } from "lucide-react";

export interface ChartDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const ChartDialog: React.FC<ChartDialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        className="relative w-full h-full max-w-[95vw] max-h-[95vh] rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1a1f3a 0%, #2d1b4e 100%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <Maximize2
              className="w-4 h-4 sm:w-5 sm:h-5"
              style={{ color: "#00d4ff" }}
            />
            <h2
              style={{
                fontSize: "var(--text-lg)",
                fontWeight: "var(--font-bold)",
                color: "#ffffff",
              }}
              className="sm:text-xl"
            >
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all hover:bg-white/10"
            style={{
              color: "#ffffff",
            }}
            aria-label="Close dialog"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-2 sm:p-4 md:p-6 h-[calc(100%-3.5rem)] sm:h-[calc(100%-4rem)] overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
