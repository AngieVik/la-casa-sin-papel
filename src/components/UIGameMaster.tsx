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
  TimerOff,
  Hourglass,
  UserX,
  Ban,
  Send,
  MessageCircle,
  Gauge,
  PowerOff,
  Pause,
  RotateCcw,
} from "lucide-react";
import ModalWrapper from "./ModalWrapper";
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

  // Calculate clock time locally
  const timeString = useGameClock(clockConfig);

  // Store actions
  const gmUpdateTicker = useStore((state) => state.gmUpdateTicker);
  const gmStartGame = useStore((state) => state.gmStartGame);
  const gmEndGame = useStore((state) => state.gmEndGame);
  const gmSetBaseTime = useStore((state) => state.gmSetBaseTime);
  const gmStartClock = useStore((state) => state.gmStartClock);
  const gmPauseClock = useStore((state) => state.gmPauseClock);
  const gmResetClock = useStore((state) => state.gmResetClock);
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

  // Local state
  const [localTicker, setLocalTicker] = useState(tickerText);
  const [globalState, setGlobalState] = useState("Día 1: Planificación");
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [playerStateInput, setPlayerStateInput] = useState("");
  const [publicStateInput, setPublicStateInput] = useState("");
  const [whisperText, setWhisperText] = useState("");
  const [showShutdownConfirm, setShowShutdownConfirm] = useState(false);

  // Clock buffer state (para poder editar sin que se borre)
  const [localTime, setLocalTime] = useState(
    formatTimeToMMSS(clockConfig.baseTime)
  );
  const [isEditingClock, setIsEditingClock] = useState(false);

  // Sync local time with timeString when not editing
  useEffect(() => {
    if (!isEditingClock) {
      setLocalTime(formatTimeToMMSS(clockConfig.baseTime));
    }
  }, [clockConfig.baseTime, isEditingClock]);

  const handleClockBlur = () => {
    setIsEditingClock(false);
    gmSetStaticTime(localTime);
  };

  const handleEndSession = async () => {
    if (
      confirm(
        "¿FINALIZAR OPERATIVO? Se borrará el chat y el estado global volverá a espera."
      )
    ) {
      await gmEndGame();
      setNickname("");
      setGM(false);
      setCurrentView("login");
    }
  };

  const handleTickerUpdate = () => {
    gmUpdateTicker(localTicker);
  };

  const handleStartGame = () => {
    const sortedGames = Object.entries(votes).sort(
      (a, b) => Object.keys(b[1] || {}).length - Object.keys(a[1] || {}).length
    );
    const winner = sortedGames.length > 0 ? sortedGames[0][0] : "g1";

    if (confirm("¿INICIAR MISIÓN? Todos los operativos serán desplegados.")) {
      gmStartGame(winner);
    }
  };

  const openPlayerEdit = (playerId: string) => {
    const player = players.find((p) => p.id === playerId);
    if (player) {
      setPlayerStateInput(player.playerState || "");
      setPublicStateInput(player.publicState || "");
      setWhisperText("");
      setEditingPlayer(playerId);
    }
  };

  const handleSavePlayerState = async () => {
    if (editingPlayer) {
      await gmUpdatePlayerState(
        editingPlayer,
        playerStateInput,
        publicStateInput
      );
    }
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
    <div className="max-w-5xl mx-auto pb-24 animate-in fade-in duration-500">
      {/* --- GM Header / Tabs --- */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
            <Settings className="text-red-500 animate-spin-slow" size={24} />
            Panel de Control
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
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "control"
                ? "bg-neutral-800 text-white shadow-md"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Users size={16} />{" "}
            <span className="hidden md:inline">Operativos</span>
          </button>
          <button
            onClick={() => setActiveTab("narrative")}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
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
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
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
              onClick={handleStartGame}
              className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all transform active:scale-95 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
            >
              <Play size={18} fill="currentColor" /> INICIAR
            </button>
          ) : (
            <button
              onClick={() => gmEndGame()}
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all transform active:scale-95 shadow-[0_0_15px_rgba(220,38,38,0.3)]"
            >
              <Square size={18} fill="currentColor" /> DETENER
            </button>
          )}

          <button
            onClick={handleEndSession}
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
                Gestión de Operativos ({players.filter((p) => !p.isGM).length})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {players
                .filter((p) => !p.isGM)
                .map((player) => (
                  <div
                    key={player.id}
                    className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl flex items-center justify-between group hover:border-neutral-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
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
                        {player.publicState && (
                          <div className="text-xs text-blue-400 mt-1">
                            {player.publicState}
                          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-right-4 duration-300">
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
                  className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold px-4 py-2 rounded-xl transition-colors"
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

              {/* INPUT EDITABLE - Para configurar la hora base */}
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                <label className="text-xs text-neutral-500 mb-2 block">
                  Configurar Tiempo (MM:SS):
                </label>
                <input
                  type="text"
                  pattern="[0-9]{2}:[0-9]{2}"
                  placeholder="00:00"
                  value={localTime}
                  onChange={(e) => setLocalTime(e.target.value)}
                  onFocus={() => setIsEditingClock(true)}
                  onBlur={handleClockBlur}
                  className="text-3xl font-mono font-black text-green-500 bg-transparent text-center w-full focus:outline-none placeholder:text-green-900"
                />
              </div>

              {/* BOTONES DE CONTROL - Grid 2 columnas */}
              <div className="grid grid-cols-2 gap-4">
                {/* TARJETA CUENTA ATRÁS */}
                <button
                  onClick={() => {
                    if (
                      clockConfig.mode === "countdown" &&
                      clockConfig.startTime !== null &&
                      clockConfig.pausedAt === null
                    ) {
                      gmPauseClock();
                    } else {
                      gmStartClock("countdown");
                    }
                  }}
                  className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl border transition-all hover:scale-105 ${
                    clockConfig.mode === "countdown" &&
                    clockConfig.startTime !== null &&
                    clockConfig.pausedAt === null
                      ? "bg-orange-900/30 border-orange-500 text-orange-400"
                      : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-orange-600"
                  }`}
                >
                  {clockConfig.mode === "countdown" &&
                  clockConfig.startTime !== null &&
                  clockConfig.pausedAt === null ? (
                    <Pause size={32} className="text-orange-500" />
                  ) : (
                    <Play
                      size={32}
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
                      clockConfig.startTime !== null &&
                      clockConfig.pausedAt === null
                    ) {
                      gmPauseClock();
                    } else {
                      gmStartClock("stopwatch");
                    }
                  }}
                  className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl border transition-all hover:scale-105 ${
                    clockConfig.mode === "stopwatch" &&
                    clockConfig.startTime !== null &&
                    clockConfig.pausedAt === null
                      ? "bg-green-900/30 border-green-500 text-green-400"
                      : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-green-600"
                  }`}
                >
                  {clockConfig.mode === "stopwatch" &&
                  clockConfig.startTime !== null &&
                  clockConfig.pausedAt === null ? (
                    <Pause size={32} className="text-green-500" />
                  ) : (
                    <Play
                      size={32}
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

            {/* Global State */}
            <div className="space-y-4 md:col-span-2">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                <Globe size={16} /> Estado Global (Fase)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  "Día 1",
                  "Noche 1",
                  "Día 2",
                  "Noche 2",
                  "Alerta Roja",
                  "Victoria",
                  "Derrota",
                ].map((state) => (
                  <button
                    key={state}
                    onClick={() => {
                      setGlobalState(state);
                      gmUpdateGlobalState(state);
                    }}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      globalState === state
                        ? "bg-green-600 border-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-600"
                    }`}
                  >
                    {state}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: ACCIONES */}
        {activeTab === "actions" && (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <button className="aspect-square bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-4 group hover:bg-neutral-800 hover:border-indigo-500 transition-all">
                <div className="p-4 bg-indigo-500/10 rounded-full group-hover:bg-indigo-500 text-indigo-500 group-hover:text-white transition-colors">
                  <MessageSquare size={32} />
                </div>
                <span className="font-bold text-neutral-300 group-hover:text-white">
                  Mensaje Secreto
                </span>
              </button>

              <button className="aspect-square bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-4 group hover:bg-neutral-800 hover:border-pink-500 transition-all">
                <div className="p-4 bg-pink-500/10 rounded-full group-hover:bg-pink-500 text-pink-500 group-hover:text-white transition-colors">
                  <Volume2 size={32} />
                </div>
                <span className="font-bold text-neutral-300 group-hover:text-white">
                  Efecto Sonido
                </span>
              </button>

              <button className="aspect-square bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-4 group hover:bg-neutral-800 hover:border-orange-500 transition-all">
                <div className="p-4 bg-orange-500/10 rounded-full group-hover:bg-orange-500 text-orange-500 group-hover:text-white transition-colors">
                  <Zap size={32} />
                </div>
                <span className="font-bold text-neutral-300 group-hover:text-white">
                  Vibración
                </span>
              </button>

              <button className="aspect-square bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-4 group hover:bg-neutral-800 hover:border-blue-500 transition-all">
                <div className="p-4 bg-blue-500/10 rounded-full group-hover:bg-blue-500 text-blue-500 group-hover:text-white transition-colors">
                  <Mic size={32} />
                </div>
                <span className="font-bold text-neutral-300 group-hover:text-white">
                  Voz Divina
                </span>
              </button>
            </div>

            <div className="mt-8 p-4 bg-red-950/20 border border-red-900/30 rounded-xl">
              <h4 className="text-red-500 font-bold mb-4 flex items-center gap-2">
                <Settings size={16} /> Zona de Peligro
              </h4>
              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={() => setShowShutdownConfirm(true)}
                  className="px-4 py-2 bg-red-900/20 text-red-400 border border-red-900/50 rounded-lg hover:bg-red-900 hover:text-white text-sm transition-colors flex items-center gap-2"
                >
                  <PowerOff size={16} /> APAGAR (Reset Seguro)
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
          <div className="space-y-4">
            {/* States */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs text-neutral-500 uppercase mb-1">
                  Estado Privado (Solo GM)
                </label>
                <input
                  type="text"
                  value={playerStateInput}
                  onChange={(e) => setPlayerStateInput(e.target.value)}
                  placeholder="Ej: Tiene el código..."
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 uppercase mb-1">
                  Estado Público (Visible)
                </label>
                <input
                  type="text"
                  value={publicStateInput}
                  onChange={(e) => setPublicStateInput(e.target.value)}
                  placeholder="Ej: Herido, Confuso..."
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <button
                onClick={handleSavePlayerState}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-bold transition-colors"
              >
                Guardar Estados
              </button>
            </div>

            {/* Whisper */}
            <div className="border-t border-neutral-800 pt-4">
              <label className="block text-xs text-neutral-500 uppercase mb-1">
                <MessageCircle size={12} className="inline mr-1" /> Whisper
                (Mensaje Privado)
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
                onClick={async () => {
                  if (
                    confirm(
                      `¿Expulsar a ${editingPlayerData.nickname} permanentemente?`
                    )
                  ) {
                    await gmRemovePlayer(editingPlayer);
                    setEditingPlayer(null);
                  }
                }}
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
        <ModalWrapper
          title="⚠️ Confirmación de Apagado"
          onClose={() => setShowShutdownConfirm(false)}
        >
          <div className="space-y-6">
            <p className="text-neutral-300 text-center text-lg">
              ¿REINICIAR SALA? Se borrarán chats, votos y estados. Las
              conexiones se mantienen.
            </p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  await gmResetRoom();
                  setShowShutdownConfirm(false);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
              >
                Sí, reiniciar
              </button>
              <button
                onClick={() => setShowShutdownConfirm(false)}
                className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white px-6 py-3 rounded-lg font-bold transition-colors"
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
