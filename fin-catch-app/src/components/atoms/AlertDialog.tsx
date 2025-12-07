import React from "react";
import { AlertCircle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "info" | "warning" | "error" | "success";
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = "info"
}) => {
  const iconColors = {
    info: "text-blue-600 bg-blue-100",
    warning: "text-amber-600 bg-amber-100",
    error: "text-red-600 bg-red-100",
    success: "text-green-600 bg-green-100",
  };

  const buttonColors = {
    info: "bg-gradient-to-r from-cyan-300 to-blue-700",
    warning: "bg-gradient-to-r from-yellow-400 to-orange-500",
    error: "bg-gradient-to-r from-red-400 to-red-600",
    success: "bg-gradient-to-r from-green-400 to-green-600",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${iconColors[type]}`}>
          <AlertCircle className="w-8 h-8" />
        </div>
        <p className="text-gray-700 mb-6">{message}</p>
        <Button
          variant="primary"
          className={`w-full ${buttonColors[type]} text-white`}
          onClick={onClose}
        >
          OK
        </Button>
      </div>
    </Modal>
  );
};
