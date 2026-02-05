import React, { createContext, useContext, useState, useCallback } from "react";
import { AlertCircle, CheckCircle, Info } from "lucide-react";
import { cn } from "@fin-catch/shared";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@fin-catch/ui/components/atoms";

export type DialogType = "alert" | "confirm";
export type DialogVariant = "info" | "success" | "warning" | "error";

interface DialogOptions {
  type: DialogType;
  variant?: DialogVariant;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

interface DialogContextType {
  showAlert: (
    message: string,
    options?: Partial<Omit<DialogOptions, "type" | "message">>,
  ) => void;
  showConfirm: (
    message: string,
    options?: Partial<Omit<DialogOptions, "type" | "message">>,
  ) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

const variantConfig = {
  info: {
    icon: Info,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/20",
  },
  success: {
    icon: CheckCircle,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/20",
  },
  warning: {
    icon: AlertCircle,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/20",
  },
  error: {
    icon: AlertCircle,
    iconColor: "text-red-400",
    iconBg: "bg-red-500/20",
  },
};

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    options: DialogOptions;
    resolve?: (value: boolean) => void;
  }>({
    isOpen: false,
    options: {
      type: "alert",
      message: "",
    },
  });

  const showAlert = useCallback(
    (
      message: string,
      options?: Partial<Omit<DialogOptions, "type" | "message">>,
    ) => {
      setDialogState({
        isOpen: true,
        options: {
          type: "alert",
          variant: "info",
          confirmText: "OK",
          ...options,
          message,
        },
      });
    },
    [],
  );

  const showConfirm = useCallback(
    (
      message: string,
      options?: Partial<Omit<DialogOptions, "type" | "message">>,
    ): Promise<boolean> => {
      return new Promise((resolve) => {
        setDialogState({
          isOpen: true,
          options: {
            type: "confirm",
            variant: "warning",
            confirmText: "Confirm",
            cancelText: "Cancel",
            ...options,
            message,
          },
          resolve,
        });
      });
    },
    [],
  );

  const handleConfirm = useCallback(() => {
    if (dialogState.resolve) {
      dialogState.resolve(true);
    }
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, [dialogState.resolve]);

  const handleCancel = useCallback(() => {
    if (dialogState.resolve) {
      dialogState.resolve(false);
    }
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, [dialogState.resolve]);

  const config = variantConfig[dialogState.options.variant || "info"];
  const Icon = config.icon;

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <AlertDialog
        open={dialogState.isOpen}
        onOpenChange={(open) => !open && handleCancel()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex flex-col items-center space-y-4 text-center">
              <div
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center",
                  config.iconBg,
                )}
              >
                <Icon className={cn("w-8 h-8", config.iconColor)} />
              </div>
              {dialogState.options.title && (
                <AlertDialogTitle>{dialogState.options.title}</AlertDialogTitle>
              )}
              <AlertDialogDescription>
                {dialogState.options.message}
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3 sm:gap-2 mt-6">
            {dialogState.options.type === "confirm" ? (
              <>
                <AlertDialogCancel onClick={handleCancel}>
                  {dialogState.options.cancelText}
                </AlertDialogCancel>
                <AlertDialogAction
                  className={cn(
                    dialogState.options.variant === "error" &&
                      "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
                  )}
                  onClick={handleConfirm}
                >
                  {dialogState.options.confirmText}
                </AlertDialogAction>
              </>
            ) : (
              <AlertDialogAction onClick={handleConfirm} className="w-full">
                {dialogState.options.confirmText}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DialogContext.Provider>
  );
};

export const useDialog = (): DialogContextType => {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
};
