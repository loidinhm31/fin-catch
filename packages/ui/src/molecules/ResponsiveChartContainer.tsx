import React, { useState } from "react";
import { Maximize2 } from "lucide-react";
import { ChartDialog } from "../organisms";

export interface ResponsiveChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  fullscreenChildren?: React.ReactNode; // Different view for fullscreen
  showExpandButton?: boolean;
  className?: string;
}

export const ResponsiveChartContainer: React.FC<
  ResponsiveChartContainerProps
> = ({
  title,
  subtitle,
  children,
  fullscreenChildren,
  showExpandButton = true,
  className = "",
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <>
      {/* Regular View */}
      <div className={`w-full ${className}`}>
        <div className="mb-4 flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3
                style={{
                  fontSize: "var(--text-lg)",
                  fontWeight: "var(--font-bold)",
                  color: "var(--cube-gray-900)",
                }}
              >
                {title}
              </h3>
              {showExpandButton && (
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Expand chart to fullscreen"
                  title="Expand to fullscreen"
                >
                  <Maximize2 className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
            {subtitle && (
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--cube-gray-900)",
                  opacity: 0.7,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="glass-card p-2 sm:p-4">{children}</div>

        <p
          className="mt-2 text-center hidden sm:block"
          style={{
            fontSize: "var(--text-xs)",
            color: "#718096",
          }}
        >
          Tap expand icon for fullscreen view • Hover for details
        </p>
        <p
          className="mt-2 text-center sm:hidden"
          style={{
            fontSize: "var(--text-xs)",
            color: "#718096",
          }}
        >
          Tap expand icon for better view • Touch for details
        </p>
      </div>

      {/* Fullscreen Dialog */}
      <ChartDialog
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        title={title}
      >
        {fullscreenChildren || children}
      </ChartDialog>
    </>
  );
};
