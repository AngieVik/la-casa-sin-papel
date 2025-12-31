import React, { useState, useEffect } from "react";
import { useStore } from "../store";
import {
  Users,
  BookOpen,
  Zap,
  Settings,
  Power,
  Mic,
  Volume2,
  MessageSquare,
  Edit2,
  CheckCircle2,
  Clock,
  Type,
  Globe,
  Play,
  Square,
  Timer,
  Hourglass,
  UserX,
  Ban,
  Send,
  MessageCircle,
  Gauge,
  PowerOff,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  User,
  Eye,
  EyeOff,
  Fingerprint,
} from "lucide-react";
import ModalWrapper from "./ModalWrapper";
import ConfirmModal from "./ConfirmModal";
import { useGameClock, formatTimeToMMSS } from "../hooks/useGameClock";

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
  const currentGlobalState = useStore((state) => state.room.globalState);

  // Calculate clock time locally

  // Store actions
  const gmUpdateTicker = useStore((state) => state.gmUpdateTicker);
  const gmStartGame = useStore((state) => state.gmStartGame);
  const gmEndGame = useStore((state) => state.gmEndGame);
  const gmStartClock = useStore((state) => state.gmStartClock);
  const gmPauseClock = useStore((state) => state.gmPauseClock);
  const gmSetStaticTime = useStore((state) => state.gmSetStaticTime);
  const gmSetTickerSpeed = useStore((state) => state.gmSetTickerSpeed);
  const gmKickPlayer = useStore((state) => state.gmKickPlayer);
  const gmRemovePlayer = useStore((state) => state.gmRemovePlayer);
  const gmUpdatePlayerState = useStore((state) => state.gmUpdatePlayerState);
  const gmWhisper = useStore((state) => state.gmWhisper);
  const gmResetRoom = useStore((state) => state.gmResetRoom);
  const gmUpdateGlobalState = useStore((state) => state.gmUpdateGlobalState);
  const setCurrentView = useStore((state) => state.setCurrentView);
  const setNickname = useStore((state) => state.setNickname);
  const setGM = useStore((state) => state.setGM);
  // State management actions
  const gmAddGlobalState = useStore((state) => state.gmAddGlobalState);
  const gmEditGlobalState = useStore((state) => state.gmEditGlobalState);
  const gmDeleteGlobalState = useStore((state) => state.gmDeleteGlobalState);
  const gmAddPlayerStateOption = useStore(
    (state) => state.gmAddPlayerStateOption
  );
  const gmEditPlayerStateOption = useStore(
    (state) => state.gmEditPlayerStateOption
  );
  const gmDeletePlayerStateOption = useStore(
    (state) => state.gmDeletePlayerStateOption
  );
  const gmAddPublicStateOption = useStore(
    (state) => state.gmAddPublicStateOption
  );
  const gmEditPublicStateOption = useStore(
    (state) => state.gmEditPublicStateOption
  );
  const gmDeletePublicStateOption = useStore(
    (state) => state.gmDeletePublicStateOption
  );
  const gmTogglePlayerState = useStore((state) => state.gmTogglePlayerState);
  const gmTogglePublicState = useStore((state) => state.gmTogglePublicState);
  const gmSendSound = useStore((state) => state.gmSendSound);
  const gmSendVibration = useStore((state) => state.gmSendVibration);
  const gmSendDivineVoice = useStore((state) => state.gmSendDivineVoice);
  const gmSendGlobalMessage = useStore((state) => state.gmSendGlobalMessage);
  const gmUpdatePlayerRole = useStore((state) => state.gmUpdatePlayerRole);

  // Local state
  const [localTicker, setLocalTicker] = useState(tickerText);
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [whisperText, setWhisperText] = useState("");
  const [divineVoiceText, setDivineVoiceText] = useState("");
  const [showShutdownConfirm, setShowShutdownConfirm] = useState(false);
  const [showEndSessionConfirm, setShowEndSessionConfirm] = useState(false);
  const [showStartGameConfirm, setShowStartGameConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showExpelConfirm, setShowExpelConfirm] = useState(false);

  // Player edit modal dropdowns
  const [showPlayerStateDropdown, setShowPlayerStateDropdown] = useState(false);
  const [showPublicStateDropdown, setShowPublicStateDropdown] = useState(false);
  const [showSoundDropdown, setShowSoundDropdown] = useState(false);
  const [showVibrationDropdown, setShowVibrationDropdown] = useState(false);

  // Global actions modal state
  const [showGlobalMessageModal, setShowGlobalMessageModal] = useState(false);
  const [globalMessageText, setGlobalMessageText] = useState("");
  const [showGlobalSoundDropdown, setShowGlobalSoundDropdown] = useState(false);
  const [showGlobalVibrationDropdown, setShowGlobalVibrationDropdown] =
    useState(false);
  const [showGlobalDivineVoiceModal, setShowGlobalDivineVoiceModal] =
    useState(false);
  const [globalDivineVoiceText, setGlobalDivineVoiceText] = useState("");

  // State card editing
  const [editingState, setEditingState] = useState<{
    type: "global" | "player" | "public";
    value: string;
  } | null>(null);
  const [newStateName, setNewStateName] = useState("");
  const [addingStateType, setAddingStateType] = useState<
    "global" | "player" | "public" | null
  >(null);
  const [assigningState, setAssigningState] = useState<{
    type: "player" | "public";
    value: string;
  } | null>(null);
  const [deleteStateConfirm, setDeleteStateConfirm] = useState<{
    type: "global" | "player" | "public";
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
    setWhisperText("");
    setDivineVoiceText("");
    setShowPlayerStateDropdown(false);
    setShowPublicStateDropdown(false);
    setShowSoundDropdown(false);
    setShowVibrationDropdown(false);
    setEditingPlayer(playerId);
  };

  const handleWhisper = async () => {
    if (editingPlayer && whisperText.trim()) {
      await gmWhisper(editingPlayer, whisperText);
      setWhisperText("");
    }
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
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider">
                Jugadores ({players.filter((p) => !p.isGM).length})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {players
                .filter((p) => !p.isGM)
                .map((player) => (
                  <div
                    key={player.id}
                    className="bg-neutral-950 border border-neutral-800 p-2 rounded-xl flex items-center justify-between group hover:border-neutral-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-3 rounded-full ${
                          player.ready
                            ? "bg-green-500/10 text-green-500 border border-green-500/30"
                            : "bg-neutral-800 text-neutral-600 border border-neutral-700"
                        }`}
                      >
                        <Users size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-lg">
                            {player.nickname}
                          </span>
                          {player.ready ? (
                            <CheckCircle2
                              size={14}
                              className="text-green-500"
                            />
                          ) : (
                            <Clock size={14} className="text-yellow-500/50" />
                          )}
                        </div>
                        <div className="text-xs text-neutral-500 font-mono uppercase tracking-widest">
                          {player.role || "Sin Rol"}
                        </div>
                        {(player.publicStates || []).length > 0 && (
                          <div className="text-xs text-blue-400 mt-1 flex flex-wrap gap-1">
                            {(player.publicStates || []).map((state) => (
                              <span
                                key={state}
                                className="bg-blue-900/30 px-1 rounded"
                              >
                                {state}
                              </span>
                            ))}
                          </div>
                        )}
                        {/* Private states indicator */}
                        {(player.playerStates || []).length > 0 && (
                          <span className="text-[10px] text-purple-400 font-mono">
                            🔒 {(player.playerStates || []).length} estado(s)
                            privado(s)
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => openPlayerEdit(player.id)}
                      className="p-2 bg-neutral-800 rounded hover:text-red-400 text-neutral-400 transition-colors"
                      title="Editar Jugador"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                ))}
              {players.filter((p) => !p.isGM).length === 0 && (
                <div className="col-span-full py-12 text-center text-neutral-600 font-mono text-sm border-2 border-dashed border-neutral-800 rounded-2xl">
                  Esperando la conexión de agentes...
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: NARRATIVA */}
        {activeTab === "narrative" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-right-4 duration-300">
            {/* GAME SELECTOR (Intercambiado) */}
            <div className="md:col-span-2 p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
              <h4 className="text-neutral-300 font-bold mb-2 flex items-center gap-2">
                <BookOpen size={16} /> Selector de Juego
              </h4>
              <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-1">
                {[
                  {
                    id: "juego1",
                    title: "Atraco al Banco",
                    desc: "Gestión de recursos",
                  },
                  { id: "juego2", title: "El Topo", desc: "Roles ocultos" },
                  {
                    id: "juego3",
                    title: "Protocolo Fantasma",
                    desc: "Hackeo y sigilo",
                  },
                  {
                    id: "juego4",
                    title: "Motín en la Prisión",
                    desc: "Control de áreas",
                  },
                  { id: "juego5", title: "La Fuga", desc: "Cooperativo" },
                  { id: "juego6", title: "Negociación", desc: "Bluffing" },
                ].map((game) => {
                  const gameVotes = votes[game.id]
                    ? Object.keys(votes[game.id]).length
                    : 0;
                  const isSelected =
                    useStore.getState().room.gameSelected === game.id;
                  return (
                    <button
                      key={game.id}
                      onClick={() => useStore.getState().gmSelectGame(game.id)}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        isSelected
                          ? "bg-green-600/20 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                          : "bg-neutral-900 border-neutral-700 hover:border-neutral-500"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h5
                            className={`font-bold ${
                              isSelected ? "text-green-400" : "text-white"
                            }`}
                          >
                            {game.title}
                          </h5>
                          <p className="text-xs text-neutral-500">
                            {game.desc}
                          </p>
                        </div>
                        <div
                          className={`flex items-center gap-1 p-1 rounded-full text-xs font-bold ${
                            gameVotes > 0
                              ? "bg-red-600 text-white"
                              : "bg-neutral-800 text-neutral-500"
                          }`}
                        >
                          {gameVotes}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1">
                          <CheckCircle2
                            size={16}
                            className="text-green-400 animate-pulse"
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Global State */}
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-neutral-500 tracking-wider uppercase flex items-center gap-2">
                  Estado Global (Fase) <Globe size={14} />
                </label>
                <button
                  onClick={() => setAddingStateType("global")}
                  className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-green-500 transition-colors"
                  title="Añadir estado"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-1">
                {globalStates.map((state) => (
                  <div key={state} className="relative group">
                    <button
                      onClick={() => {
                        if (currentGlobalState === state) {
                          gmUpdateGlobalState(""); // Deselect
                        } else {
                          gmUpdateGlobalState(state);
                        }
                      }}
                      className={`w-full p-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-between bg-purple-950/20 border-purple-900/50 text-purple-400 hover:border-purple-500 hover:bg-purple-950/30 ${
                        currentGlobalState === state
                          ? "bg-green-600 border-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-600"
                      }`}
                    >
                      <span className="truncate">{state}</span>
                      {currentGlobalState === state && (
                        <CheckCircle2 size={14} className="shrink-0 ml-2" />
                      )}
                    </button>
                    <div className="absolute -top-6 -right-1 hidden group-hover:flex gap-1 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingState({ type: "global", value: state });
                          setNewStateName(state);
                        }}
                        className="p-1.5 bg-blue-600 rounded-full text-white hover:bg-blue-500 shadow-lg"
                        title="Editar"
                      >
                        <Edit2 size={10} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteStateConfirm({
                            type: "global",
                            value: state,
                          });
                        }}
                        className="p-1.5 bg-red-600 rounded-full text-white hover:bg-red-500 shadow-lg"
                        title="Borrar"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Personal States (PlayerState) */}
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                  Estados Personales <EyeOff size={14} />
                </label>
                <button
                  onClick={() => setAddingStateType("player")}
                  className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-green-500 transition-colors"
                  title="Añadir estado"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-1">
                {playerStates.map((state) => (
                  <div key={state} className="relative group">
                    <button
                      onClick={() =>
                        setAssigningState({ type: "player", value: state })
                      }
                      className="w-full p-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-between bg-purple-950/20 border-purple-900/50 text-purple-400 hover:border-purple-500 hover:bg-purple-950/30"
                    >
                      <span className="truncate">{state}</span>
                      <EyeOff size={14} className="shrink-0 ml-2" />
                    </button>
                    <div className="absolute -top-6 -right-1 hidden group-hover:flex gap-1 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingState({ type: "player", value: state });
                          setNewStateName(state);
                        }}
                        className="p-1.5 bg-blue-600 rounded-full text-white hover:bg-blue-500 shadow-lg"
                        title="Editar"
                      >
                        <Edit2 size={10} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteStateConfirm({
                            type: "player",
                            value: state,
                          });
                        }}
                        className="p-1.5 bg-red-600 rounded-full text-white hover:bg-red-500 shadow-lg"
                        title="Borrar"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Public States (PublicState) */}
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                  Estados Públicos (Visible) <Eye size={14} />
                </label>
                <button
                  onClick={() => setAddingStateType("public")}
                  className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-green-500 transition-colors"
                  title="Añadir estado"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-1">
                {publicStates.map((state) => (
                  <div key={state} className="relative group">
                    <button
                      onClick={() =>
                        setAssigningState({ type: "public", value: state })
                      }
                      className="w-full p-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-between bg-blue-950/20 border-blue-900/50 text-blue-400 hover:border-blue-500 hover:bg-blue-950/30"
                    >
                      <span className="truncate">{state}</span>
                      <Eye size={14} className="shrink-0 ml-2" />
                    </button>
                    <div className="absolute -top-6 -right-1 hidden group-hover:flex gap-1 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingState({ type: "public", value: state });
                          setNewStateName(state);
                        }}
                        className="p-1.5 bg-blue-600 rounded-full text-white hover:bg-blue-500 shadow-lg"
                        title="Editar"
                      >
                        <Edit2 size={10} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteStateConfirm({
                            type: "public",
                            value: state,
                          });
                        }}
                        className="p-1.5 bg-red-600 rounded-full text-white hover:bg-red-500 shadow-lg"
                        title="Borrar"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: ACCIONES */}
        {activeTab === "actions" && (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-4 gap-1">
              {/* Global Message Button */}
              <button
                onClick={() => setShowGlobalMessageModal(true)}
                className="aspect-[2/1] bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-1 group hover:bg-neutral-800 hover:border-indigo-500 transition-all"
              >
                <div className="p-1 bg-indigo-500/10 rounded-full group-hover:bg-indigo-500 text-indigo-500 group-hover:text-white transition-colors">
                  <MessageSquare size={32} />
                </div>
                <span className="font-bold text-neutral-300 group-hover:text-white">
                  Mensaje Global
                </span>
              </button>

              {/* Sound Effect Button with Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowGlobalSoundDropdown(!showGlobalSoundDropdown);
                    setShowGlobalVibrationDropdown(false);
                  }}
                  className="aspect-[2/1] w-full bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-1 group hover:bg-neutral-800 hover:border-pink-500 transition-all"
                >
                  <div className="p-1 bg-pink-500/10 rounded-full group-hover:bg-pink-500 text-pink-500 group-hover:text-white transition-colors">
                    <Volume2 size={32} />
                  </div>
                  <span className="font-bold text-neutral-300 group-hover:text-white">
                    Efecto Sonido
                  </span>
                </button>
                {showGlobalSoundDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                    {[
                      { id: "gong", emoji: "🔔", name: "GONG" },
                      { id: "aullido", emoji: "🐺", name: "Aullido" },
                      { id: "gallo", emoji: "🐓", name: "Gallo" },
                      { id: "risabruja", emoji: "🧙‍♀️", name: "Risa Bruja" },
                      { id: "reallynigga", emoji: "😤", name: "Really Nigga" },
                    ].map((sound) => (
                      <button
                        key={sound.id}
                        onClick={() => {
                          gmSendSound(null, sound.id);
                          showGmToastMsg(
                            `✅ ${sound.emoji} ${sound.name} enviado a ${
                              players.filter((p) => !p.isGM).length
                            } jugadores`
                          );
                          setShowGlobalSoundDropdown(false);
                        }}
                        className="w-full p-2 text-left text-sm text-neutral-300 hover:bg-pink-900/30 hover:text-pink-400 transition-colors"
                      >
                        {sound.emoji} {sound.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Vibration Button with Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowGlobalVibrationDropdown(
                      !showGlobalVibrationDropdown
                    );
                    setShowGlobalSoundDropdown(false);
                  }}
                  className="aspect-[2/1] w-full bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-1 group hover:bg-neutral-800 hover:border-orange-500 transition-all"
                >
                  <div className="p-1 bg-orange-500/10 rounded-full group-hover:bg-orange-500 text-orange-500 group-hover:text-white transition-colors">
                    <Zap size={32} />
                  </div>
                  <span className="font-bold text-neutral-300 group-hover:text-white">
                    Vibración
                  </span>
                </button>
                {showGlobalVibrationDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-20">
                    <button
                      onClick={() => {
                        gmSendVibration(null, 10);
                        showGmToastMsg(
                          `📳 Vibración débil enviada a ${
                            players.filter((p) => !p.isGM).length
                          } jugadores`
                        );
                        setShowGlobalVibrationDropdown(false);
                      }}
                      className="w-full p-2 text-left text-sm text-neutral-300 hover:bg-orange-900/30 hover:text-orange-400 transition-colors"
                    >
                      Débil
                    </button>
                    <button
                      onClick={() => {
                        gmSendVibration(null, 100);
                        showGmToastMsg(
                          `📳 Vibración media enviada a ${
                            players.filter((p) => !p.isGM).length
                          } jugadores`
                        );
                        setShowGlobalVibrationDropdown(false);
                      }}
                      className="w-full p-2 text-left text-sm text-neutral-300 hover:bg-orange-900/30 hover:text-orange-400 transition-colors"
                    >
                      Media
                    </button>
                    <button
                      onClick={() => {
                        gmSendVibration(null, 200);
                        showGmToastMsg(
                          `📳 Vibración fuerte enviada a ${
                            players.filter((p) => !p.isGM).length
                          } jugadores`
                        );
                        setShowGlobalVibrationDropdown(false);
                      }}
                      className="w-full p-2 text-left text-sm text-neutral-300 hover:bg-orange-900/30 hover:text-orange-400 transition-colors"
                    >
                      Fuerte
                    </button>
                  </div>
                )}
              </div>

              {/* Divine Voice Button */}
              <button
                onClick={() => setShowGlobalDivineVoiceModal(true)}
                className="aspect-[2/1] bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-1 group hover:bg-neutral-800 hover:border-blue-500 transition-all"
              >
                <div className="p-1 bg-blue-500/10 rounded-full group-hover:bg-blue-500 text-blue-500 group-hover:text-white transition-colors">
                  <Mic size={32} />
                </div>
                <span className="font-bold text-neutral-300 group-hover:text-white">
                  Voz Divina
                </span>
              </button>
            </div>

            {/* Ticker & Clock configuration (Intercambiado) */}
            <div className="mt-4 pt-4 border-t border-neutral-800 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Ticker Control */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                  <Type size={16} /> Mensaje del Ticker
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={localTicker}
                    onChange={(e) => setLocalTicker(e.target.value)}
                    className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-yellow-500 focus:outline-none transition-colors"
                  />
                  <button
                    onClick={handleTickerUpdate}
                    className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold px-2 py-1 rounded-xl transition-colors"
                  >
                    Publicar
                  </button>
                </div>

                {/* Ticker Speed Slider */}
                <div className="mt-4">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2 mb-2">
                    <Gauge size={16} /> Velocidad del Ticker: {tickerSpeed}s
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    value={tickerSpeed}
                    onChange={(e) => gmSetTickerSpeed(Number(e.target.value))}
                    className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-600">
                    <span>Rápido</span>
                    <span>Lento</span>
                  </div>
                </div>
              </div>

              {/* Reloj del Juego */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                  <Clock size={16} /> Reloj del Juego
                </label>

                {/* INPUT EDITABLE BLINDADO */}
                <div className="bg-neutral-950 w-[150px] rounded-xl border border-neutral-800">
                  <input
                    type="text"
                    placeholder="00:00"
                    value={localTime}
                    onChange={handleTimeChange}
                    onFocus={() => setIsEditingClock(true)}
                    onBlur={handleClockBlur}
                    className="text-3xl font-mono font-black text-green-500 bg-transparent text-center w-full focus:outline-none placeholder:text-green-900"
                  />
                </div>

                {/* BOTONES DE CONTROL - Grid 2 columnas */}
                <div className="grid grid-cols-2 gap-1">
                  {/* TARJETA CUENTA ATRÁS */}
                  <button
                    onClick={() => {
                      if (
                        clockConfig.mode === "countdown" &&
                        clockConfig.isRunning
                      ) {
                        gmPauseClock();
                      } else {
                        gmStartClock("countdown");
                      }
                    }}
                    className={`flex flex-col items-center justify-center gap-2 p-2 rounded-xl border transition-all hover:scale-105 ${
                      clockConfig.mode === "countdown" && clockConfig.isRunning
                        ? "bg-orange-900/30 border-orange-500 text-orange-400"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-orange-600"
                    }`}
                  >
                    {clockConfig.mode === "countdown" &&
                    clockConfig.isRunning ? (
                      <Pause size={25} className="text-orange-500" />
                    ) : (
                      <Play
                        size={25}
                        fill="currentColor"
                        className="text-orange-500"
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <Hourglass size={20} />
                      <span className="font-bold text-sm">Cuenta Atrás</span>
                    </div>
                  </button>

                  {/* TARJETA CRONÓMETRO */}
                  <button
                    onClick={() => {
                      if (
                        clockConfig.mode === "stopwatch" &&
                        clockConfig.isRunning
                      ) {
                        gmPauseClock();
                      } else {
                        gmStartClock("stopwatch");
                      }
                    }}
                    className={`flex flex-col items-center justify-center gap-2 p-2 rounded-xl border transition-all hover:scale-105 ${
                      clockConfig.mode === "stopwatch" && clockConfig.isRunning
                        ? "bg-green-900/30 border-green-500 text-green-400"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-green-600"
                    }`}
                  >
                    {clockConfig.mode === "stopwatch" &&
                    clockConfig.isRunning ? (
                      <Pause size={25} className="text-green-500" />
                    ) : (
                      <Play
                        size={25}
                        fill="currentColor"
                        className="text-green-500"
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <Timer size={20} />
                      <span className="font-bold text-sm">Cronómetro</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-2 p-2 bg-red-950/20 border border-red-900/30 rounded-xl">
              <h4 className="text-red-500 font-bold mb-4 flex items-center gap-2">
                <Settings size={16} /> Zona peligrosa
              </h4>
              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={() => setShowShutdownConfirm(true)}
                  className="px-2 py-1 bg-red-900/20 text-red-400 border border-red-900/50 rounded-lg hover:bg-red-900 hover:text-white text-sm transition-colors flex items-center gap-2"
                >
                  <PowerOff size={16} /> SHUTDOWN (Reset Total)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Player Edit Modal */}
      {editingPlayer && editingPlayerData && (
        <ModalWrapper
          title={`Editar: ${editingPlayerData.nickname}`}
          onClose={() => setEditingPlayer(null)}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Role Editing */}
            <div>
              <label className="block text-xs text-neutral-500 uppercase mb-2 flex items-center gap-1">
                <Fingerprint size={12} /> Rol del Jugador
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  defaultValue={editingPlayerData.role || "Player"}
                  onBlur={(e) => {
                    const newRole = e.target.value.trim() || "Player";
                    if (newRole !== (editingPlayerData.role || "Player")) {
                      gmUpdatePlayerRole(editingPlayer, newRole);
                    }
                  }}
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm"
                  placeholder="Ej: Mafioso, Detective..."
                />
              </div>
            </div>

            {/* Current States Display */}
            <div>
              <label className="block text-xs text-neutral-500 uppercase mb-2 flex items-center gap-1">
                <EyeOff size={12} /> Estados Privados (click para quitar)
              </label>
              <div className="flex flex-wrap gap-1 min-h-[32px] p-2 bg-neutral-900 rounded-lg border border-neutral-700">
                {(editingPlayerData.playerStates || []).length === 0 && (
                  <span className="text-neutral-600 text-xs">Sin estados</span>
                )}
                {(editingPlayerData.playerStates || []).map((state) => (
                  <button
                    key={state}
                    onClick={() => gmTogglePlayerState(editingPlayer, state)}
                    className="px-2 py-1 bg-purple-900/30 text-purple-400 rounded text-xs hover:bg-red-900/30 hover:text-red-400 transition-colors"
                  >
                    {state} ×
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-500 uppercase mb-2 flex items-center gap-1">
                <Eye size={12} /> Estados Públicos (click para quitar)
              </label>
              <div className="flex flex-wrap gap-1 min-h-[32px] p-2 bg-neutral-900 rounded-lg border border-neutral-700">
                {(editingPlayerData.publicStates || []).length === 0 && (
                  <span className="text-neutral-600 text-xs">Sin estados</span>
                )}
                {(editingPlayerData.publicStates || []).map((state) => (
                  <button
                    key={state}
                    onClick={() => gmTogglePublicState(editingPlayer, state)}
                    className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-xs hover:bg-red-900/30 hover:text-red-400 transition-colors"
                  >
                    {state} ×
                  </button>
                ))}
              </div>
            </div>

            {/* Dropdowns Grid */}
            <div className="grid grid-cols-2 gap-2">
              {/* Add Player State Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowPlayerStateDropdown(!showPlayerStateDropdown);
                    setShowPublicStateDropdown(false);
                    setShowSoundDropdown(false);
                    setShowVibrationDropdown(false);
                  }}
                  className="w-full p-2 bg-purple-900/20 text-purple-400 border border-purple-900/50 rounded-lg text-sm hover:bg-purple-900/40 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={14} /> Añadir estado
                </button>
                {showPlayerStateDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-20 max-h-40 overflow-y-auto">
                    {playerStates.map((state) => (
                      <button
                        key={state}
                        onClick={() => {
                          gmTogglePlayerState(editingPlayer, state);
                          setShowPlayerStateDropdown(false);
                        }}
                        className="w-full p-2 text-left text-sm text-neutral-300 hover:bg-purple-900/30 hover:text-purple-400 transition-colors"
                      >
                        {state}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Public State Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowPublicStateDropdown(!showPublicStateDropdown);
                    setShowPlayerStateDropdown(false);
                    setShowSoundDropdown(false);
                    setShowVibrationDropdown(false);
                  }}
                  className="w-full p-2 bg-blue-900/20 text-blue-400 border border-blue-900/50 rounded-lg text-sm hover:bg-blue-900/40 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={14} /> Añadir público
                </button>
                {showPublicStateDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-20 max-h-40 overflow-y-auto">
                    {publicStates.map((state) => (
                      <button
                        key={state}
                        onClick={() => {
                          gmTogglePublicState(editingPlayer, state);
                          setShowPublicStateDropdown(false);
                        }}
                        className="w-full p-2 text-left text-sm text-neutral-300 hover:bg-blue-900/30 hover:text-blue-400 transition-colors"
                      >
                        {state}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sound Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSoundDropdown(!showSoundDropdown);
                    setShowPlayerStateDropdown(false);
                    setShowPublicStateDropdown(false);
                    setShowVibrationDropdown(false);
                  }}
                  className="w-full p-2 bg-pink-900/20 text-pink-400 border border-pink-900/50 rounded-lg text-sm hover:bg-pink-900/40 transition-colors flex items-center justify-center gap-2"
                >
                  <Volume2 size={14} /> Sonidos
                </button>
                {showSoundDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                    {[
                      { id: "gong", emoji: "🔔", name: "GONG" },
                      { id: "aullido", emoji: "🐺", name: "Aullido" },
                      { id: "gallo", emoji: "🐓", name: "Gallo" },
                      { id: "risabruja", emoji: "🧙‍♀️", name: "Risa Bruja" },
                      { id: "reallynigga", emoji: "😤", name: "Really Nigga" },
                    ].map((sound) => (
                      <button
                        key={sound.id}
                        onClick={() => {
                          gmSendSound(editingPlayer, sound.id);
                          setShowSoundDropdown(false);
                        }}
                        className="w-full p-2 text-left text-sm text-neutral-300 hover:bg-pink-900/30 hover:text-pink-400 transition-colors"
                      >
                        {sound.emoji} {sound.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Vibration Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowVibrationDropdown(!showVibrationDropdown);
                    setShowPlayerStateDropdown(false);
                    setShowPublicStateDropdown(false);
                    setShowSoundDropdown(false);
                  }}
                  className="w-full p-2 bg-orange-900/20 text-orange-400 border border-orange-900/50 rounded-lg text-sm hover:bg-orange-900/40 transition-colors flex items-center justify-center gap-2"
                >
                  <Zap size={14} /> Vibración
                </button>
                {showVibrationDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-20">
                    <button
                      onClick={() => {
                        gmSendVibration(editingPlayer, 10);
                        setShowVibrationDropdown(false);
                      }}
                      className="w-full p-2 text-left text-sm text-neutral-300 hover:bg-orange-900/30 hover:text-orange-400 transition-colors"
                    >
                      Débil (10ms)
                    </button>
                    <button
                      onClick={() => {
                        gmSendVibration(editingPlayer, 100);
                        setShowVibrationDropdown(false);
                      }}
                      className="w-full p-2 text-left text-sm text-neutral-300 hover:bg-orange-900/30 hover:text-orange-400 transition-colors"
                    >
                      Media (100ms)
                    </button>
                    <button
                      onClick={() => {
                        gmSendVibration(editingPlayer, 200);
                        setShowVibrationDropdown(false);
                      }}
                      className="w-full p-2 text-left text-sm text-neutral-300 hover:bg-orange-900/30 hover:text-orange-400 transition-colors"
                    >
                      Fuerte (200ms)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Divine Voice */}
            <div className="border-t border-neutral-800 pt-4">
              <label className="block text-xs text-neutral-500 uppercase mb-1 flex items-center gap-1">
                <Mic size={12} /> Voz Divina (Solo este player)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={divineVoiceText}
                  onChange={(e) => setDivineVoiceText(e.target.value)}
                  placeholder="Mensaje divino..."
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm"
                />
                <button
                  onClick={() => {
                    if (divineVoiceText.trim()) {
                      gmSendDivineVoice(editingPlayer, divineVoiceText);
                      setDivineVoiceText("");
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>

            {/* Whisper */}
            <div className="border-t border-neutral-800 pt-4">
              <label className="block text-xs text-neutral-500 uppercase mb-1 flex items-center gap-1">
                <MessageCircle size={12} /> Whisper (Mensaje Privado Chat)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={whisperText}
                  onChange={(e) => setWhisperText(e.target.value)}
                  placeholder="Mensaje privado..."
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm"
                />
                <button
                  onClick={handleWhisper}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-neutral-800 pt-4 grid grid-cols-2 gap-2">
              <button
                onClick={async () => {
                  await gmKickPlayer(editingPlayer);
                  setEditingPlayer(null);
                }}
                className="flex items-center justify-center gap-2 p-3 bg-yellow-900/20 text-yellow-500 border border-yellow-900/50 rounded-lg hover:bg-yellow-900 hover:text-white text-sm transition-colors"
              >
                <UserX size={16} /> Kick (→ Patio)
              </button>
              <button
                onClick={() => setShowExpelConfirm(true)}
                className="flex items-center justify-center gap-2 p-3 bg-red-900/20 text-red-500 border border-red-900/50 rounded-lg hover:bg-red-900 hover:text-white text-sm transition-colors"
              >
                <Ban size={16} /> Expulsar
              </button>
            </div>
          </div>
        </ModalWrapper>
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

      {/* EDIT STATE MODAL */}
      {editingState && (
        <ModalWrapper
          title={`Editar ${
            editingState.type === "global"
              ? "Estado Global"
              : editingState.type === "player"
              ? "Estado Personal"
              : "Estado Público"
          }`}
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
          title={`Añadir ${
            addingStateType === "global"
              ? "Estado Global"
              : addingStateType === "player"
              ? "Estado Personal"
              : "Estado Público"
          }`}
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
