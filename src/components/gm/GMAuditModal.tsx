import React from "react";
import { Trash2, Zap } from "lucide-react";
import ModalWrapper from "../ModalWrapper";
import ConfirmModal from "../ConfirmModal";
import { Player } from "../../types";

interface GMAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  playerToDelete: { id: string; nickname: string } | null;
  setPlayerToDelete: (player: { id: string; nickname: string } | null) => void;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (show: boolean) => void;
  onConfirmDelete: () => void;
}

const GMAuditModal: React.FC<GMAuditModalProps> = ({
  isOpen,
  onClose,
  players,
  playerToDelete,
  setPlayerToDelete,
  showDeleteConfirm,
  setShowDeleteConfirm,
  onConfirmDelete,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <ModalWrapper title="Auditoría de Sesiones" onClose={onClose}>
        <div className="space-y-4">
          <div className="bg-yellow-900/20 border border-yellow-700/50 p-3 rounded-lg text-yellow-500 text-xs mb-4 flex items-center gap-2">
            <Zap size={14} />
            <p>
              Usa 'Limpiar' solo para eliminar sesiones fantasma o duplicadas
              manualmente.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-neutral-500 text-xs border-b border-neutral-700">
                  <th className="p-2">Nickname</th>
                  <th className="p-2">UID</th>
                  <th className="p-2 text-center">Estado</th>
                  <th className="p-2 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {players.map((player) => {
                  const isDuplicate =
                    players.filter((p) => p.nickname === player.nickname)
                      .length > 1;
                  return (
                    <tr
                      key={player.id}
                      className={`border-b border-neutral-800 ${
                        isDuplicate ? "bg-red-900/10" : ""
                      }`}
                    >
                      <td className="p-2 font-bold text-white">
                        {player.nickname}
                        {isDuplicate && (
                          <span className="ml-2 text-[10px] text-red-500 bg-red-900/20 px-1 rounded border border-red-900/50">
                            DUPLICADO
                          </span>
                        )}
                      </td>
                      <td className="p-2 font-mono text-[10px] text-neutral-500">
                        {player.id}
                      </td>
                      <td className="p-2 text-center">
                        <div
                          className={`w-2 h-2 rounded-full mx-auto ${
                            player.status === "online"
                              ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"
                              : "bg-neutral-700"
                          }`}
                          title={player.status}
                        />
                      </td>
                      <td className="p-2 text-right">
                        <button
                          onClick={() => {
                            setPlayerToDelete({
                              id: player.id,
                              nickname: player.nickname,
                            });
                            setShowDeleteConfirm(true);
                          }}
                          className="p-1.5 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded transition-colors"
                          title="Limpiar Sesión"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-bold"
            >
              Cerrar
            </button>
          </div>
        </div>
      </ModalWrapper>

      {/* AUDIT DELETE CONFIRMATION MODAL - Rendered here to keep it self-contained */}
      {showDeleteConfirm && playerToDelete && (
        <ConfirmModal
          title="Eliminar Sesión"
          message={`¿Seguro que quieres eliminar la sesión de ${playerToDelete.nickname}? Esta acción es irreversible.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="danger"
          onConfirm={onConfirmDelete}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setPlayerToDelete(null);
          }}
        />
      )}
    </>
  );
};

export default GMAuditModal;
