import React from "react";
import { AlertCircle, X } from "lucide-react";

interface ErrorAlertProps {
  message: string;
  onDismiss: () => void;
}

export const ErrorAlert = React.memo(function ErrorAlert({
  message,
  onDismiss,
}: ErrorAlertProps) {
  return (
    <div
      className="mb-4 p-3 border-l-4 rounded-r-lg flex items-start gap-3"
      style={{
        backgroundColor: "var(--color-alert-error-bg)",
        borderColor: "var(--color-alert-error-border)",
      }}
    >
      <AlertCircle
        className="w-5 h-5 flex-shrink-0 mt-0.5"
        style={{ color: "var(--color-alert-error-text)" }}
      />
      <p
        className="text-sm flex-1"
        style={{ color: "var(--color-alert-error-text)" }}
      >
        {message}
      </p>
      <button
        onClick={onDismiss}
        style={{ color: "var(--color-alert-error-text)" }}
        className="hover:opacity-80"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
});

ErrorAlert.displayName = "ErrorAlert";
