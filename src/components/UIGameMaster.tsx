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
} from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import ModalWrapper from "./ModalWrapper";
import GMControlTab from "./gm/GMControlTab";
import GMNarrativeTab from "./gm/GMNarrativeTab";
import GMActionsTab from "./gm/GMActionsTab";
import PlayerEditModal from "./gm/PlayerEditModal";
import StateManagementModals from "./gm/StateManagementModals";
import GMAuditModal from "./gm/GMAuditModal";
import GlobalMessageModal from "./gm/GlobalMessageModal";
import GlobalDivineVoiceModal from "./gm/GlobalDivineVoiceModal";
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
      <div className="flex md:flex-row items-center justify-between  gap-2">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white  tracking-tighter flex items-center gap-2">
            GM
          </h2>
          <p className="text-neutral-500 text-xs font-mono tracking-widest">
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
              className="hover:text-red-800 gap-2 transition-colors"
            >
              <Square size={30} fill="currentColor" />
            </button>
          )}

          <button
            onClick={() => gm.setShowResetConfirm(true)}
            className="hover:text-red-800 gap-2 transition-colors"
            title="Refrescar sesión"
          >
            <RotateCcw size={30} />
          </button>

          <button
            onClick={gm.handleTogglePower}
            className={`hover:text-red-800 gap-2 transition-colors ${
              gm.isRoomClosed ? " hover:text-red-800 " : " hover:text-red-800 "
            }`}
            title={gm.isRoomClosed ? "Encender Sala" : "Cerrar Sala"}
          >
            <Power size={30} />
          </button>
        </div>
      </div>

      {/* --- Tab Content --- */}
      <div className="relative overflow-hidden">
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
      <GlobalMessageModal
        isOpen={gm.showGlobalMessageModal}
        onClose={() => gm.setShowGlobalMessageModal(false)}
        message={gm.globalMessageText}
        setMessage={gm.setGlobalMessageText}
        onSend={gm.handleSendGlobalMessage}
      />

      {/* GM AUDIT MODAL */}
      <GMAuditModal
        isOpen={gm.showAuditModal}
        onClose={() => gm.setShowAuditModal(false)}
        players={gm.players}
        playerToDelete={gm.playerToDelete}
        setPlayerToDelete={gm.setPlayerToDelete}
        showDeleteConfirm={gm.showAuditDeleteConfirm}
        setShowDeleteConfirm={gm.setShowAuditDeleteConfirm}
        onConfirmDelete={gm.handleAuditDelete}
      />

      {/* GLOBAL DIVINE VOICE MODAL */}
      <GlobalDivineVoiceModal
        isOpen={gm.showGlobalDivineVoiceModal}
        onClose={() => gm.setShowGlobalDivineVoiceModal(false)}
        message={gm.globalDivineVoiceText}
        setMessage={gm.setGlobalDivineVoiceText}
        onSend={gm.handleSendDivineVoice}
      />
    </div>
  );
};

export default UIGameMaster;
