import React from "react";
import { AlertCircle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "warning" | "danger";
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning",
}) => {
  const iconColors = {
    warning: "text-amber-600 bg-amber-100",
    danger: "text-red-600 bg-red-100",
  };

  const confirmButtonColors = {
    warning: "bg-gradient-to-r from-yellow-400 to-orange-500",
    danger: "bg-gradient-to-r from-red-400 to-red-600",
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${iconColors[type]}`}>
          <AlertCircle className="w-8 h-8" />
        </div>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button
            variant="primary"
            className={`flex-1 ${confirmButtonColors[type]} text-white`}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
