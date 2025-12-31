import React from "react";
import { X, AlertTriangle, Info, AlertCircle } from "lucide-react";

type ConfirmVariant = "danger" | "warning" | "info";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: ConfirmVariant;
}

const variantConfig = {
  danger: {
    icon: AlertTriangle,
    iconColor: "text-red-500",
    bgColor: "bg-red-900/20",
    borderColor: "border-red-900/50",
    confirmBg: "bg-red-600 hover:bg-red-700",
  },
  warning: {
    icon: AlertCircle,
    iconColor: "text-yellow-500",
    bgColor: "bg-yellow-900/20",
    borderColor: "border-yellow-900/50",
    confirmBg: "bg-yellow-600 hover:bg-yellow-700",
  },
  info: {
    icon: Info,
    iconColor: "text-blue-500",
    bgColor: "bg-blue-900/20",
    borderColor: "border-blue-900/50",
    confirmBg: "bg-blue-600 hover:bg-blue-700",
  },
};

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  variant = "danger",
}) => {
  const config = variantConfig[variant];
  const IconComponent = config.icon;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onCancel}
    >
      <div
        className={`relative w-full max-w-md ${config.bgColor} border ${config.borderColor} rounded-xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <IconComponent className={config.iconColor} size={24} />
            <h2 className="text-xl font-bold text-neutral-100 uppercase tracking-wider">
              {title}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-red-500 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-neutral-300 text-center text-lg">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className={`flex-1 ${config.confirmBg} text-white px-4 py-3 rounded-lg font-bold transition-colors`}
          >
            {confirmText}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-3 rounded-lg font-bold transition-colors"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
