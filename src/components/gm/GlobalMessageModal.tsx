import React from "react";
import ModalWrapper from "../ModalWrapper";

interface GlobalMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  setMessage: (msg: string) => void;
  onSend: () => void;
}

const GlobalMessageModal: React.FC<GlobalMessageModalProps> = ({
  isOpen,
  onClose,
  message,
  setMessage,
  onSend,
}) => {
  if (!isOpen) return null;

  return (
    <ModalWrapper
      title="Mensaje Global"
      onClose={() => {
        onClose();
        setMessage("");
      }}
    >
      <div className="space-y-4">
        <p className="text-neutral-400 text-sm">
          Envía un mensaje que verán todos los jugadores:
        </p>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Mensaje para todos..."
          className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white"
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={onSend}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-bold"
          >
            Enviar a Todos
          </button>
          <button
            onClick={() => {
              onClose();
              setMessage("");
            }}
            className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white py-2 rounded-lg font-bold"
          >
            Cancelar
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default GlobalMessageModal;
