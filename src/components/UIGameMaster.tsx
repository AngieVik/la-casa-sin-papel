import React, { useState, useEffect } from "react";
import { useStore } from "../store";
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
import { formatTimeToMMSS } from "../hooks/useGameClock";
import GMControlTab from "./gm/GMControlTab";
import GMNarrativeTab from "./gm/GMNarrativeTab";
import GMActionsTab from "./gm/GMActionsTab";
import PlayerEditModal from "./gm/PlayerEditModal";
import StateManagementModals from "./gm/StateManagementModals";

type TabID = "control" | "narrative" | "actions";

const UIGameMaster: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabID>("control");

  // Store data
  const tickerText = useStore((state) => state.room.tickerText);
  const clockConfig = useStore((state) => state.room.clockConfig);
  const tickerSpeed = useStore((state) => state.room.tickerSpeed);
  const status = useStore((state) => state.room.status);
  const players = useStore((state) => state.room.players);
  const votes = useStore((state) => state.room.votes);
  const globalStates = useStore((state) => state.room.globalStates);
  const playerStates = useStore((state) => state.room.playerStates);
  const publicStates = useStore((state) => state.room.publicStates);
  const roles = useStore((state) => state.room.roles);
  const gameSelected = useStore((state) => state.room.gameSelected);
  const currentGlobalState = useStore((state) => state.room.globalState);

  // Store actions (only those still used directly here)
  const gmUpdateTicker = useStore((state) => state.gmUpdateTicker);
  const gmSelectGame = useStore((state) => state.gmSelectGame);
  const gmStartGame = useStore((state) => state.gmStartGame);
  const gmEndGame = useStore((state) => state.gmEndGame);
  const gmSetStaticTime = useStore((state) => state.gmSetStaticTime);
  const gmKickPlayer = useStore((state) => state.gmKickPlayer);
  const gmRemovePlayer = useStore((state) => state.gmRemovePlayer);
  const gmResetRoom = useStore((state) => state.gmResetRoom);
  const setCurrentView = useStore((state) => state.setCurrentView);
  const setNickname = useStore((state) => state.setNickname);
  const setGM = useStore((state) => state.setGM);
  const gmSendDivineVoice = useStore((state) => state.gmSendDivineVoice);
  const gmSendGlobalMessage = useStore((state) => state.gmSendGlobalMessage);

  // Local state
  const [localTicker, setLocalTicker] = useState(tickerText);
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [showShutdownConfirm, setShowShutdownConfirm] = useState(false);
  const [showEndSessionConfirm, setShowEndSessionConfirm] = useState(false);
  const [showStartGameConfirm, setShowStartGameConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showExpelConfirm, setShowExpelConfirm] = useState(false);

  // Global actions modal state
  const [showGlobalMessageModal, setShowGlobalMessageModal] = useState(false);
  const [globalMessageText, setGlobalMessageText] = useState("");
  const [showGlobalDivineVoiceModal, setShowGlobalDivineVoiceModal] =
    useState(false);
  const [globalDivineVoiceText, setGlobalDivineVoiceText] = useState("");

  // State card editing (passed to StateManagementModals)
  const [editingState, setEditingState] = useState<{
    type: "global" | "player" | "public" | "role";
    value: string;
  } | null>(null);
  const [newStateName, setNewStateName] = useState("");
  const [addingStateType, setAddingStateType] = useState<
    "global" | "player" | "public" | "role" | null
  >(null);
  const [assigningState, setAssigningState] = useState<{
    type: "player" | "public";
    value: string;
  } | null>(null);
  const [deleteStateConfirm, setDeleteStateConfirm] = useState<{
    type: "global" | "player" | "public" | "role";
    value: string;
  } | null>(null);

  // GM Toast for action confirmations
  const [gmToast, setGmToast] = useState<string | null>(null);

  // Clock buffer state
  const [localTime, setLocalTime] = useState(
    formatTimeToMMSS(clockConfig.baseTime)
  );
  const [isEditingClock, setIsEditingClock] = useState(false);

  // Sync local time with baseTime when not editing (Static Config View)
  useEffect(() => {
    if (!isEditingClock) {
      setLocalTime(formatTimeToMMSS(clockConfig.baseTime));
    }
  }, [clockConfig.baseTime, isEditingClock]);

  // Manejador del input de tiempo BLINDADO
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Eliminar cualquier cosa que no sea número
    let raw = e.target.value.replace(/\D/g, "");

    // 2. Limitar a 4 dígitos (MMSS)
    if (raw.length > 4) raw = raw.slice(0, 4);

    // 3. Formatear visualmente
    // Si escribe "1" -> "1"
    // Si escribe "12" -> "12"
    // Si escribe "123" -> "12:3" (Inserta los dos puntos solo)
    // Si escribe "1234" -> "12:34"
    let formatted = raw;
    if (raw.length >= 3) {
      formatted = raw.slice(0, 2) + ":" + raw.slice(2);
    }

    setLocalTime(formatted);
  };

  const handleClockBlur = () => {
    setIsEditingClock(false);
    // Al salir, enviamos lo que haya. La función del store lo saneará si faltan ceros.
    gmSetStaticTime(localTime);
  };

  const handleEndSession = async () => {
    await gmEndGame();
    setNickname("");
    setGM(false);
    setCurrentView("login");
    setShowEndSessionConfirm(false);
  };

  // Toast helper for GM action confirmations
  const showGmToastMsg = (msg: string) => {
    setGmToast(msg);
    setTimeout(() => setGmToast(null), 2500);
  };

  const handleTickerUpdate = () => {
    gmUpdateTicker(localTicker);
  };

  const handleStartGame = () => {
    const sortedGames = Object.entries(votes).sort(
      (a, b) => Object.keys(b[1] || {}).length - Object.keys(a[1] || {}).length
    );
    const winner = sortedGames.length > 0 ? sortedGames[0][0] : "g1";
    gmStartGame(winner);
    setShowStartGameConfirm(false);
  };

  const openPlayerEdit = (playerId: string) => {
    setEditingPlayer(playerId);
  };

  const editingPlayerData = editingPlayer
    ? players.find((p) => p.id === editingPlayer)
    : null;

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      {/* GM Toast Confirmation */}
      {gmToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top fade-in duration-300">
          <div className="px-6 py-3 bg-gradient-to-r from-green-900/90 to-emerald-900/90 border border-green-500/50 rounded-full shadow-2xl shadow-green-500/30 flex items-center gap-3">
            <span className="text-white font-bold">{gmToast}</span>
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
                status === "playing" ? "text-green-500" : "text-yellow-500"
              }
            >
              {status}
            </span>
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-neutral-900 p-1 rounded-xl border border-neutral-800">
          <button
            onClick={() => setActiveTab("control")}
            className={`flex items-center gap-2 px-2 py-1 rounded-lg text-sm font-bold transition-all ${
              activeTab === "control"
                ? "bg-neutral-800 text-white shadow-md"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Users size={16} />{" "}
            <span className="hidden md:inline">Jugadores</span>
          </button>
          <button
            onClick={() => setActiveTab("narrative")}
            className={`flex items-center gap-2 px-2 py-1 rounded-lg text-sm font-bold transition-all ${
              activeTab === "narrative"
                ? "bg-neutral-800 text-white shadow-md"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <BookOpen size={16} />{" "}
            <span className="hidden md:inline">Narrativa</span>
          </button>
          <button
            onClick={() => setActiveTab("actions")}
            className={`flex items-center gap-2 px-2 py-1 rounded-lg text-sm font-bold transition-all ${
              activeTab === "actions"
                ? "bg-neutral-800 text-white shadow-md"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Zap size={16} /> <span className="hidden md:inline">Acciones</span>
          </button>
        </div>

        <div className="flex gap-2">
          {status === "waiting" ? (
            <button
              onClick={() => setShowStartGameConfirm(true)}
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-2 py-1 rounded-xl flex items-center gap-2 transition-all transform active:scale-95 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
            >
              <Play size={20} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={() => gmEndGame()}
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-2 py-1 rounded-xl flex items-center gap-2 transition-all transform active:scale-95 shadow-[0_0_15px_rgba(220,38,38,0.3)]"
            >
              <Square size={20} fill="currentColor" /> DETENER
            </button>
          )}

          <button
            onClick={() => setShowResetConfirm(true)}
            className="bg-neutral-800 hover:bg-neutral-700 text-yellow-500 border border-neutral-700 p-2 rounded-xl transition-colors"
            title="Reiniciar (enviar todos al patio)"
          >
            <RotateCcw size={20} />
          </button>

          <button
            onClick={() => setShowEndSessionConfirm(true)}
            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-400 border border-neutral-700 p-2 rounded-xl transition-colors"
            title="Desconectar"
          >
            <Power size={20} />
          </button>
        </div>
      </div>

      {/* --- Tab Content --- */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 min-h-[500px] shadow-2xl relative overflow-hidden">
        {/* TAB: CONTROL (Players) */}
        {activeTab === "control" && (
          <GMControlTab
            players={players}
            votes={votes}
            gameSelected={gameSelected}
            onSelectGame={gmSelectGame}
            onEditPlayer={openPlayerEdit}
          />
        )}

        {/* TAB: NARRATIVA */}
        {activeTab === "narrative" && (
          <GMNarrativeTab
            globalStates={globalStates}
            playerStates={playerStates}
            publicStates={publicStates}
            roles={roles}
            currentGlobalState={currentGlobalState}
            onAddState={(type) => setAddingStateType(type)}
            onEditState={(type, value) => {
              setEditingState({ type, value });
              setNewStateName(value);
            }}
            onDeleteState={(type, value) =>
              setDeleteStateConfirm({ type, value })
            }
            onAssignState={(type, value) => setAssigningState({ type, value })}
          />
        )}

        {/* TAB: ACCIONES */}
        {activeTab === "actions" && (
          <GMActionsTab
            players={players}
            tickerText={localTicker}
            tickerSpeed={tickerSpeed}
            clockConfig={clockConfig}
            localTime={localTime}
            isEditingClock={isEditingClock}
            onShowGlobalMessageModal={() => setShowGlobalMessageModal(true)}
            onShowDivineVoiceModal={() => setShowGlobalDivineVoiceModal(true)}
            onShowShutdownConfirm={() => setShowShutdownConfirm(true)}
            onTickerChange={setLocalTicker}
            onTickerUpdate={handleTickerUpdate}
            onTimeChange={handleTimeChange}
            onClockFocus={() => setIsEditingClock(true)}
            onClockBlur={handleClockBlur}
            showGmToast={showGmToastMsg}
          />
        )}
      </div>

      {/* Player Edit Modal */}
      {editingPlayer && editingPlayerData && (
        <PlayerEditModal
          player={editingPlayerData}
          playerStates={playerStates}
          publicStates={publicStates}
          roles={roles}
          onClose={() => setEditingPlayer(null)}
          onKick={async () => {
            await gmKickPlayer(editingPlayer);
            setEditingPlayer(null);
          }}
          onExpel={() => setShowExpelConfirm(true)}
        />
      )}

      {/* SHUTDOWN CONFIRMATION MODAL */}
      {showShutdownConfirm && (
        <ConfirmModal
          title="¿Confirmas SHUTDOWN?"
          message="Reiniciarás la base de datos, se borrarán chats, votos y estados. ¡Todo hará puff!"
          confirmText="Sí, ¡Por favor!"
          cancelText="Mejor no..."
          variant="danger"
          onConfirm={async () => {
            await gmResetRoom();
            setShowShutdownConfirm(false);
          }}
          onCancel={() => setShowShutdownConfirm(false)}
        />
      )}

      {/* END SESSION CONFIRMATION MODAL */}
      {showEndSessionConfirm && (
        <ConfirmModal
          title="Finalizar Operativo"
          message="¿FINALIZAR OPERATIVO? Se borrará el chat y el estado global volverá a espera."
          confirmText="Sí, salir"
          cancelText="Cancelar"
          variant="danger"
          onConfirm={handleEndSession}
          onCancel={() => setShowEndSessionConfirm(false)}
        />
      )}

      {/* START GAME CONFIRMATION MODAL */}
      {showStartGameConfirm && (
        <ConfirmModal
          title="Iniciar Misión"
          message="¿INICIAR MISIÓN? Todos los Jugadores serán desplegados."
          confirmText="¡Iniciar!"
          cancelText="Cancelar"
          variant="info"
          onConfirm={handleStartGame}
          onCancel={() => setShowStartGameConfirm(false)}
        />
      )}

      {/* SOFT RESET CONFIRMATION MODAL */}
      {showResetConfirm && (
        <ConfirmModal
          title="Reiniciar Partida"
          message="Se enviará a todos los jugadores al patio sin cerrar sesiones. ¿Continuar?"
          confirmText="Reiniciar"
          cancelText="Cancelar"
          variant="warning"
          onConfirm={async () => {
            await gmEndGame();
            setShowResetConfirm(false);
          }}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}

      {/* EXPEL PLAYER CONFIRMATION MODAL */}
      {showExpelConfirm && editingPlayerData && (
        <ConfirmModal
          title="Expulsar Jugador"
          message={`¿Expulsar a ${editingPlayerData.nickname} permanentemente?`}
          confirmText="Expulsar"
          cancelText="Cancelar"
          variant="danger"
          onConfirm={async () => {
            if (editingPlayer) {
              await gmRemovePlayer(editingPlayer);
              setEditingPlayer(null);
            }
            setShowExpelConfirm(false);
          }}
          onCancel={() => setShowExpelConfirm(false)}
        />
      )}

      {/* State Management Modals */}
      <StateManagementModals
        editingState={editingState}
        setEditingState={setEditingState}
        addingStateType={addingStateType}
        setAddingStateType={setAddingStateType}
        deleteStateConfirm={deleteStateConfirm}
        setDeleteStateConfirm={setDeleteStateConfirm}
        assigningState={assigningState}
        setAssigningState={setAssigningState}
        newStateName={newStateName}
        setNewStateName={setNewStateName}
        players={players}
      />

      {/* GLOBAL MESSAGE MODAL */}
      {showGlobalMessageModal && (
        <ModalWrapper
          title="Mensaje Global"
          onClose={() => {
            setShowGlobalMessageModal(false);
            setGlobalMessageText("");
          }}
        >
          <div className="space-y-4">
            <p className="text-neutral-400 text-sm">
              Envía un mensaje que verán todos los jugadores:
            </p>
            <input
              type="text"
              value={globalMessageText}
              onChange={(e) => setGlobalMessageText(e.target.value)}
              placeholder="Mensaje para todos..."
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (globalMessageText.trim()) {
                    await gmSendGlobalMessage(globalMessageText);
                    showGmToastMsg(
                      `📢 Mensaje global enviado a ${
                        players.filter((p) => !p.isGM).length
                      } jugadores`
                    );
                    setGlobalMessageText("");
                    setShowGlobalMessageModal(false);
                  }
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-bold"
              >
                Enviar a Todos
              </button>
              <button
                onClick={() => {
                  setShowGlobalMessageModal(false);
                  setGlobalMessageText("");
                }}
                className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white py-2 rounded-lg font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* GLOBAL DIVINE VOICE MODAL */}
      {showGlobalDivineVoiceModal && (
        <ModalWrapper
          title="Voz Divina Global"
          onClose={() => {
            setShowGlobalDivineVoiceModal(false);
            setGlobalDivineVoiceText("");
          }}
        >
          <div className="space-y-4">
            <p className="text-neutral-400 text-sm">
              Envía un mensaje divino a todos los jugadores:
            </p>
            <input
              type="text"
              value={globalDivineVoiceText}
              onChange={(e) => setGlobalDivineVoiceText(e.target.value)}
              placeholder="Mensaje divino para todos..."
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (globalDivineVoiceText.trim()) {
                    await gmSendDivineVoice(null, globalDivineVoiceText);
                    setGlobalDivineVoiceText("");
                    setShowGlobalDivineVoiceModal(false);
                  }
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-bold"
              >
                Enviar Voz Divina
              </button>
              <button
                onClick={() => {
                  setShowGlobalDivineVoiceModal(false);
                  setGlobalDivineVoiceText("");
                }}
                className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white py-2 rounded-lg font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
};

export default UIGameMaster;
