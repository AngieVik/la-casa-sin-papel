import React from "react";
import { X } from "lucide-react";

interface ModalWrapperProps {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
}

const ModalWrapper: React.FC<ModalWrapperProps> = ({
  children,
  onClose,
  title,
}) => {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          {title && (
            <h2 className="text-xl font-bold text-neutral-100 uppercase tracking-wider">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-red-500 transition-colors ml-auto"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="text-neutral-300">{children}</div>
      </div>
    </div>
  );
};

export default ModalWrapper;
