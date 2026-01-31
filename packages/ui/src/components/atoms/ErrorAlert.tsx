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
    <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-red-800 flex-1">{message}</p>
      <button onClick={onDismiss} className="text-red-600 hover:text-red-800">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
});

ErrorAlert.displayName = "ErrorAlert";
