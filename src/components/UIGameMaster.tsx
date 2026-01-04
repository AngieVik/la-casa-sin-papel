import React from "react";
import {
  Users,
  BookOpen,
  Zap,
  Settings,
  Power,
  Play,
  Square,
  RotateCcw,
  Trash2,
} from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import ModalWrapper from "./ModalWrapper";
import GMControlTab from "./gm/GMControlTab";
import GMNarrativeTab from "./gm/GMNarrativeTab";
import GMActionsTab from "./gm/GMActionsTab";
import GameContainer from "./gm/GameContainer";
import PlayerEditModal from "./gm/PlayerEditModal";
import StateManagementModals from "./gm/StateManagementModals";
import { useGMInterface } from "../hooks/useGMInterface";
import { getGameById } from "../constants/games";

const UIGameMaster: React.FC = () => {
  const gm = useGMInterface();

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      {/* GM Toast Confirmation */}
      {gm.gmToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top fade-in duration-300">
          <div className="px-6 py-3 bg-gradient-to-r from-green-900/90 to-emerald-900/90 border border-green-500/50 rounded-full shadow-2xl shadow-green-500/30 flex items-center gap-3">
            <span className="text-white font-bold">{gm.gmToast}</span>
          </div>
        </div>
      )}

      {/* --- GM Header / Tabs --- */}
      <div className="flex md:flex-row items-center justify-between mb-6 gap-2 border-b border-neutral-800 pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white  tracking-tighter flex items-center gap-2">
            <Settings className="text-red-500 animate-spin-slow" size={24} />
            Interfaz GM
          </h2>
          <p className="text-neutral-500 text-xs font-mono tracking-widest uppercase">
            Estado:{" "}
            <span
              className={
                gm.status === "playing" ? "text-green-500" : "text-yellow-500"
              }
            >
              {gm.status}
            </span>
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-neutral-300/10 p-1 rounded-xl border border-neutral-300/10">
          <button
            onClick={() => gm.setActiveTab("control")}
            className={`flex items-center gap-2 px-2 py-1 rounded-lg text-sm font-bold transition-all ${
              gm.activeTab === "control"
                ? "bg-neutral-800 text-white shadow-md"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Users size={24} /> <span className="hidden md:inline">Patio</span>
          </button>
          <button
            onClick={() => gm.setActiveTab("narrative")}
            className={`flex items-center gap-2 px-2 py-1 rounded-lg text-sm font-bold transition-all ${
              gm.activeTab === "narrative"
                ? "bg-neutral-800 text-white shadow-md"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <BookOpen size={24} />{" "}
            <span className="hidden md:inline">Narrativa</span>
          </button>
          <button
            onClick={() => gm.setActiveTab("actions")}
            className={`flex items-center gap-2 px-2 py-1 rounded-lg text-sm font-bold transition-all ${
              gm.activeTab === "actions"
                ? "bg-neutral-800 text-white shadow-md"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Zap size={24} /> <span className="hidden md:inline">Acciones</span>
          </button>
        </div>

        <div className="flex gap-2">
          {gm.gameStatus === "lobby" ? (
            (() => {
              const nonGMPlayers = gm.players.filter((p) => !p.isGM);
              const allReady =
                nonGMPlayers.length > 0 && nonGMPlayers.every((p) => p.ready);
              const isRegisteredGame =
                gm.gameSelected && getGameById(gm.gameSelected);

              return (
                <button
                  onClick={() => {
                    if (isRegisteredGame) {
                      // Game Engine: call prepareGame directly
                      gm.prepareGame(getGameById(gm.gameSelected!)!);
                    } else {
                      // Legacy: show confirm modal
                      gm.setShowStartGameConfirm(true);
                    }
                  }}
                  disabled={!allReady || !gm.gameSelected}
                  className={`font-bold px-2 py-1 rounded-xl flex items-center gap-2 transition-all transform active:scale-95 ${
                    allReady && gm.gameSelected
                      ? "bg-green-600 hover:bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                      : "bg-neutral-700 text-neutral-500 cursor-not-allowed"
                  }`}
                  title={
                    !allReady
                      ? "Todos los jugadores deben estar listos"
                      : !gm.gameSelected
                      ? "Selecciona un juego"
                      : "Iniciar juego"
                  }
                >
                  <Play size={20} fill="currentColor" />
                </button>
              );
            })()
          ) : (
            <button
              onClick={() => {
                const isRegisteredGame =
                  gm.gameSelected && getGameById(gm.gameSelected);
                if (isRegisteredGame) {
                  gm.stopGame();
                } else {
                  gm.gmEndGame();
                }
              }}
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-2 py-1 rounded-xl flex items-center gap-2 transition-all transform active:scale-95 shadow-[0_0_15px_rgba(220,38,38,0.3)]"
            >
              <Square size={20} fill="currentColor" />
            </button>
          )}

          <button
            onClick={() => gm.setShowResetConfirm(true)}
            className="bg-neutral-800 hover:bg-neutral-700 text-yellow-500 border border-neutral-700 p-2 rounded-xl transition-colors"
            title="Refrescar sesión"
          >
            <RotateCcw size={20} />
          </button>

          <button
            onClick={gm.handleTogglePower}
            className={`border p-2 rounded-xl transition-colors ${
              gm.isRoomClosed
                ? "bg-green-900/50 hover:bg-green-800 text-green-400 border-green-700"
                : "bg-neutral-800 hover:bg-neutral-700 text-neutral-400 border-neutral-700"
            }`}
            title={gm.isRoomClosed ? "Encender Sala" : "Cerrar Sala"}
          >
            <Power size={20} />
          </button>
        </div>
      </div>

      {/* --- Tab Content --- */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 min-h-[500px] shadow-2xl relative overflow-hidden">
        {/* TAB: CONTROL (Players) */}
        {gm.activeTab === "control" && (
          <GMControlTab
            players={gm.players}
            votes={gm.votes}
            gameSelected={gm.gameSelected}
            gameStatus={gm.gameStatus}
            onSelectGame={gm.gmSelectGame}
            onEditPlayer={gm.openPlayerEdit}
            onOpenAudit={() => gm.setShowAuditModal(true)}
          />
        )}

        {/* TAB: NARRATIVA */}
        {gm.activeTab === "narrative" && (
          <GMNarrativeTab
            globalStates={gm.globalStates}
            playerStates={gm.playerStates}
            publicStates={gm.publicStates}
            roles={gm.roles}
            currentGlobalState={gm.currentGlobalState}
            onAddState={(type) => gm.setAddingStateType(type)}
            onEditState={(type, value) => {
              gm.setEditingState({ type, value });
              gm.setNewStateName(value);
            }}
            onDeleteState={(type, value) =>
              gm.setDeleteStateConfirm({ type, value })
            }
            onAssignState={(type, value) =>
              gm.setAssigningState({ type, value })
            }
          />
        )}

        {/* TAB: ACCIONES */}
        {gm.activeTab === "actions" && (
          <GMActionsTab
            players={gm.players}
            tickerText={gm.localTicker}
            tickerSpeed={gm.tickerSpeed}
            clockConfig={gm.clockConfig}
            localTime={gm.localTime}
            isEditingClock={gm.isEditingClock}
            onShowGlobalMessageModal={() => gm.setShowGlobalMessageModal(true)}
            onShowDivineVoiceModal={() =>
              gm.setShowGlobalDivineVoiceModal(true)
            }
            onShowShutdownConfirm={() => gm.setShowShutdownConfirm(true)}
            onTickerChange={gm.setLocalTicker}
            onTickerUpdate={gm.handleTickerUpdate}
            onTimeChange={gm.handleTimeChange}
            onClockFocus={() => gm.setIsEditingClock(true)}
            onClockBlur={gm.handleClockBlur}
            showGmToast={gm.showGmToastMsg}
          />
        )}
      </div>

      {/* Player Edit Modal */}
      {gm.editingPlayer && gm.editingPlayerData && (
        <PlayerEditModal
          player={gm.editingPlayerData}
          playerStates={gm.playerStates}
          publicStates={gm.publicStates}
          roles={gm.roles}
          onClose={() => gm.setEditingPlayer(null)}
          onKick={gm.handleKickPlayer}
          onExpel={() => gm.setShowExpelConfirm(true)}
        />
      )}

      {/* SHUTDOWN CONFIRMATION MODAL */}
      {gm.showShutdownConfirm && (
        <ConfirmModal
          title="¿Confirmas SHUTDOWN?"
          message="Reiniciarás la base de datos, se borrarán chats, votos y estados. ¡Todo hará puff!"
          confirmText="Sí, ¡Por favor!"
          cancelText="Mejor no..."
          variant="danger"
          onConfirm={gm.handleShutdown}
          onCancel={() => gm.setShowShutdownConfirm(false)}
        />
      )}

      {/* END SESSION CONFIRMATION MODAL */}
      {gm.showEndSessionConfirm && (
        <ConfirmModal
          title="Cerrar Sala"
          message="¿Cerrar Sala? Se enviará a todos los jugadores al login y sus sesiones serán eliminadas."
          confirmText="Sí, cerrar"
          cancelText="Cancelar"
          variant="danger"
          onConfirm={gm.handleEndSession}
          onCancel={() => gm.setShowEndSessionConfirm(false)}
        />
      )}

      {/* START GAME CONFIRMATION MODAL */}
      {gm.showStartGameConfirm && (
        <ConfirmModal
          title="Iniciar Misión"
          message="¿INICIAR MISIÓN? Todos los Jugadores serán desplegados."
          confirmText="¡Iniciar!"
          cancelText="Cancelar"
          variant="info"
          onConfirm={gm.handleStartGame}
          onCancel={() => gm.setShowStartGameConfirm(false)}
        />
      )}

      {/* SOFT RESET CONFIRMATION MODAL */}
      {gm.showResetConfirm && (
        <ConfirmModal
          title="Refrescar Sesión"
          message="Se forzara un refresco de la sesión a todos los jugadores."
          confirmText="Refrescar"
          cancelText="Cancelar"
          variant="warning"
          onConfirm={gm.handleSoftReset}
          onCancel={() => gm.setShowResetConfirm(false)}
        />
      )}

      {/* EXPEL PLAYER CONFIRMATION MODAL */}
      {gm.showExpelConfirm && gm.editingPlayerData && (
        <ConfirmModal
          title="Expulsar Jugador"
          message={`¿Expulsar a ${gm.editingPlayerData.nickname} permanentemente?`}
          confirmText="Expulsar"
          cancelText="Cancelar"
          variant="danger"
          onConfirm={gm.handleExpelPlayer}
          onCancel={() => gm.setShowExpelConfirm(false)}
        />
      )}

      {/* State Management Modals */}
      <StateManagementModals
        editingState={gm.editingState}
        setEditingState={gm.setEditingState}
        addingStateType={gm.addingStateType}
        setAddingStateType={gm.setAddingStateType}
        deleteStateConfirm={gm.deleteStateConfirm}
        setDeleteStateConfirm={gm.setDeleteStateConfirm}
        assigningState={gm.assigningState}
        setAssigningState={gm.setAssigningState}
        newStateName={gm.newStateName}
        setNewStateName={gm.setNewStateName}
        players={gm.players}
      />

      {/* GLOBAL MESSAGE MODAL */}
      {gm.showGlobalMessageModal && (
        <ModalWrapper
          title="Mensaje Global"
          onClose={() => {
            gm.setShowGlobalMessageModal(false);
            gm.setGlobalMessageText("");
          }}
        >
          <div className="space-y-4">
            <p className="text-neutral-400 text-sm">
              Envía un mensaje que verán todos los jugadores:
            </p>
            <input
              type="text"
              value={gm.globalMessageText}
              onChange={(e) => gm.setGlobalMessageText(e.target.value)}
              placeholder="Mensaje para todos..."
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={gm.handleSendGlobalMessage}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-bold"
              >
                Enviar a Todos
              </button>
              <button
                onClick={() => {
                  gm.setShowGlobalMessageModal(false);
                  gm.setGlobalMessageText("");
                }}
                className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white py-2 rounded-lg font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* GM AUDIT MODAL */}
      {gm.showAuditModal && (
        <ModalWrapper
          title="Auditoría de Sesiones"
          onClose={() => gm.setShowAuditModal(false)}
        >
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
                  {gm.players.map((player) => {
                    const isDuplicate =
                      gm.players.filter((p) => p.nickname === player.nickname)
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
                              gm.setPlayerToDelete({
                                id: player.id,
                                nickname: player.nickname,
                              });
                              gm.setShowAuditDeleteConfirm(true);
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
                onClick={() => gm.setShowAuditModal(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* GLOBAL DIVINE VOICE MODAL */}
      {gm.showGlobalDivineVoiceModal && (
        <ModalWrapper
          title="Voz Divina Global"
          onClose={() => {
            gm.setShowGlobalDivineVoiceModal(false);
            gm.setGlobalDivineVoiceText("");
          }}
        >
          <div className="space-y-4">
            <p className="text-neutral-400 text-sm">
              Envía un mensaje divino a todos los jugadores:
            </p>
            <input
              type="text"
              value={gm.globalDivineVoiceText}
              onChange={(e) => gm.setGlobalDivineVoiceText(e.target.value)}
              placeholder="Mensaje divino para todos..."
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={gm.handleSendDivineVoice}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-bold"
              >
                Enviar Voz Divina
              </button>
              <button
                onClick={() => {
                  gm.setShowGlobalDivineVoiceModal(false);
                  gm.setGlobalDivineVoiceText("");
                }}
                className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white py-2 rounded-lg font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}
      {/* AUDIT DELETE CONFIRMATION MODAL */}
      {gm.showAuditDeleteConfirm && gm.playerToDelete && (
        <ConfirmModal
          title="Eliminar Sesión"
          message={`¿Seguro que quieres eliminar la sesión de ${gm.playerToDelete.nickname}? Esta acción es irreversible.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="danger"
          onConfirm={gm.handleAuditDelete}
          onCancel={() => {
            gm.setShowAuditDeleteConfirm(false);
            gm.setPlayerToDelete(null);
          }}
        />
      )}
    </div>
  );
};

export default UIGameMaster;
