import React from "react";
import { User } from "lucide-react";
import ModalWrapper from "../ModalWrapper";
import ConfirmModal from "../ConfirmModal";
import { useStore } from "../../store";
import { Player } from "../../types";

type StateType = "global" | "player" | "public" | "role";

interface EditingState {
  type: StateType;
  value: string;
}

interface AssigningState {
  type: "player" | "public";
  value: string;
}

interface DeleteStateConfirm {
  type: StateType;
  value: string;
}

interface StateManagementModalsProps {
  // Edit state modal
  editingState: EditingState | null;
  setEditingState: (state: EditingState | null) => void;
  // Add state modal
  addingStateType: StateType | null;
  setAddingStateType: (type: StateType | null) => void;
  // Delete state confirmation
  deleteStateConfirm: DeleteStateConfirm | null;
  setDeleteStateConfirm: (confirm: DeleteStateConfirm | null) => void;
  // Assign state modal
  assigningState: AssigningState | null;
  setAssigningState: (state: AssigningState | null) => void;
  // Shared state for new name input
  newStateName: string;
  setNewStateName: (name: string) => void;
  // Players for assignment modal
  players: Player[];
}

const StateManagementModals: React.FC<StateManagementModalsProps> = ({
  editingState,
  setEditingState,
  addingStateType,
  setAddingStateType,
  deleteStateConfirm,
  setDeleteStateConfirm,
  assigningState,
  setAssigningState,
  newStateName,
  setNewStateName,
  players,
}) => {
  // Store actions
  const gmEditGlobalState = useStore((state) => state.gmEditGlobalState);
  const gmEditPlayerStateOption = useStore(
    (state) => state.gmEditPlayerStateOption
  );
  const gmEditPublicStateOption = useStore(
    (state) => state.gmEditPublicStateOption
  );
  const gmAddGlobalState = useStore((state) => state.gmAddGlobalState);
  const gmAddPlayerStateOption = useStore(
    (state) => state.gmAddPlayerStateOption
  );
  const gmAddPublicStateOption = useStore(
    (state) => state.gmAddPublicStateOption
  );
  const gmDeleteGlobalState = useStore((state) => state.gmDeleteGlobalState);
  const gmDeletePlayerStateOption = useStore(
    (state) => state.gmDeletePlayerStateOption
  );
  const gmDeletePublicStateOption = useStore(
    (state) => state.gmDeletePublicStateOption
  );
  const gmTogglePlayerState = useStore((state) => state.gmTogglePlayerState);
  const gmTogglePublicState = useStore((state) => state.gmTogglePublicState);
  const gmAddRole = useStore((state) => state.gmAddRole);
  const gmEditRole = useStore((state) => state.gmEditRole);
  const gmDeleteRole = useStore((state) => state.gmDeleteRole);

  const getStateTypeLabel = (type: StateType): string => {
    switch (type) {
      case "global":
        return "Estado Global";
      case "player":
        return "Estado Personal";
      case "public":
        return "Estado Público";
      case "role":
        return "Rol";
    }
  };

  return (
    <>
      {/* EDIT STATE MODAL */}
      {editingState && (
        <ModalWrapper
          title={`Editar ${getStateTypeLabel(editingState.type)}`}
          onClose={() => {
            setEditingState(null);
            setNewStateName("");
          }}
        >
          <div className="space-y-4">
            <input
              type="text"
              value={newStateName}
              onChange={(e) => setNewStateName(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white"
              placeholder="Nuevo nombre"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (newStateName.trim()) {
                    if (editingState.type === "global")
                      gmEditGlobalState(
                        editingState.value,
                        newStateName.trim()
                      );
                    else if (editingState.type === "player")
                      gmEditPlayerStateOption(
                        editingState.value,
                        newStateName.trim()
                      );
                    else if (editingState.type === "role")
                      gmEditRole(editingState.value, newStateName.trim());
                    else
                      gmEditPublicStateOption(
                        editingState.value,
                        newStateName.trim()
                      );
                    setEditingState(null);
                    setNewStateName("");
                  }
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-bold"
              >
                Guardar
              </button>
              <button
                onClick={() => {
                  setEditingState(null);
                  setNewStateName("");
                }}
                className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white py-2 rounded-lg font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* ADD STATE MODAL */}
      {addingStateType && (
        <ModalWrapper
          title={`Añadir ${getStateTypeLabel(addingStateType)}`}
          onClose={() => {
            setAddingStateType(null);
            setNewStateName("");
          }}
        >
          <div className="space-y-4">
            <input
              type="text"
              value={newStateName}
              onChange={(e) => setNewStateName(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white"
              placeholder="Nombre del estado"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (newStateName.trim()) {
                    if (addingStateType === "global")
                      gmAddGlobalState(newStateName.trim());
                    else if (addingStateType === "player")
                      gmAddPlayerStateOption(newStateName.trim());
                    else if (addingStateType === "role")
                      gmAddRole(newStateName.trim());
                    else gmAddPublicStateOption(newStateName.trim());
                    setAddingStateType(null);
                    setNewStateName("");
                  }
                }}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-bold"
              >
                Añadir
              </button>
              <button
                onClick={() => {
                  setAddingStateType(null);
                  setNewStateName("");
                }}
                className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white py-2 rounded-lg font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* DELETE STATE CONFIRMATION MODAL */}
      {deleteStateConfirm && (
        <ConfirmModal
          title="Borrar Estado"
          message={`¿Borrar "${deleteStateConfirm.value}" permanentemente?`}
          confirmText="Borrar"
          cancelText="Cancelar"
          variant="danger"
          onConfirm={() => {
            if (deleteStateConfirm.type === "global")
              gmDeleteGlobalState(deleteStateConfirm.value);
            else if (deleteStateConfirm.type === "player")
              gmDeletePlayerStateOption(deleteStateConfirm.value);
            else if (deleteStateConfirm.type === "role")
              gmDeleteRole(deleteStateConfirm.value);
            else gmDeletePublicStateOption(deleteStateConfirm.value);
            setDeleteStateConfirm(null);
          }}
          onCancel={() => setDeleteStateConfirm(null)}
        />
      )}

      {/* ASSIGN STATE TO PLAYER MODAL */}
      {assigningState && (
        <ModalWrapper
          title={`Asignar "${assigningState.value}"`}
          onClose={() => setAssigningState(null)}
        >
          <div className="space-y-3">
            <p className="text-neutral-400 text-sm mb-4">
              Selecciona un jugador para asignarle este{" "}
              {assigningState.type === "player"
                ? "estado personal"
                : "estado público"}
              :
            </p>
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
              {players
                .filter((p) => !p.isGM)
                .map((player) => (
                  <button
                    key={player.id}
                    onClick={async () => {
                      if (assigningState.type === "player") {
                        await gmTogglePlayerState(
                          player.id,
                          assigningState.value
                        );
                      } else {
                        await gmTogglePublicState(
                          player.id,
                          assigningState.value
                        );
                      }
                      setAssigningState(null);
                    }}
                    className="flex items-center gap-3 p-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-left"
                  >
                    <User size={18} className="text-neutral-500" />
                    <div>
                      <span className="font-bold text-white">
                        {player.nickname}
                      </span>
                      {assigningState.type === "player" &&
                        (player.playerStates || []).length > 0 && (
                          <span className="block text-xs text-purple-400">
                            {(player.playerStates || []).join(", ")}
                          </span>
                        )}
                      {assigningState.type === "public" &&
                        (player.publicStates || []).length > 0 && (
                          <span className="block text-xs text-blue-400">
                            {(player.publicStates || []).join(", ")}
                          </span>
                        )}
                    </div>
                  </button>
                ))}
            </div>
            {players.filter((p) => !p.isGM).length === 0 && (
              <p className="text-neutral-500 text-center py-4">
                No hay jugadores conectados
              </p>
            )}
          </div>
        </ModalWrapper>
      )}
    </>
  );
};

export default StateManagementModals;
