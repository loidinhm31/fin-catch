import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@fin-catch/shared";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./AlertDialog";

interface SimpleAlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "info" | "warning" | "error" | "success";
}

/**
 * Backward-compatible AlertDialog wrapper
 * This component maintains the old API while using the refactored AlertDialog components
 */
export const SimpleAlertDialog: React.FC<SimpleAlertDialogProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
}) => {
  const iconColors = {
    info: "text-blue-400 bg-blue-900/30",
    warning: "text-amber-400 bg-amber-900/30",
    error: "text-red-400 bg-red-900/30",
    success: "text-green-400 bg-green-900/30",
  };

  const buttonColors = {
    info: "bg-cyan-500 hover:bg-cyan-600 shadow-glow-cyan",
    warning: "bg-amber-400 hover:bg-amber-500 shadow-glow-amber",
    error: "bg-red-600 hover:bg-red-700 shadow-glow-red",
    success: "bg-green-500 hover:bg-green-600 shadow-glow-green",
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex flex-col items-center space-y-4 text-center">
            <div
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center",
                iconColors[type],
              )}
            >
              <AlertCircle className="w-8 h-8" />
            </div>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{message}</AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <div className="flex justify-center mt-4">
          <AlertDialogAction
            className={cn("w-full text-white", buttonColors[type])}
            onClick={onClose}
          >
            OK
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
