import React, { useEffect, useRef, useState } from "react";
import {
  Moon,
  Eye,
  User,
  HeartPulse,
  Fingerprint,
  Volume2,
  Zap,
  MessageCircle,
  X,
  Bell,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useStore } from "../store";
import { SOUNDS, getSoundById } from "../constants/sounds";

// Notification history item
interface NotificationHistoryItem {
  id: string;
  type: "sound" | "vibration" | "divineVoice" | "globalMessage";
  message: string;
  timestamp: number;
}

const UIPlayer: React.FC = () => {
  // Store data
  const userId = useStore((state) => state.user.id);
  const nickname = useStore((state) => state.user.nickname);
  const players = useStore((state) => state.room.players);
  const globalState = useStore((state) => state.room.globalState);
  const notifications = useStore((state) => state.room.notifications);
  const clearNotification = useStore((state) => state.clearNotification);

  // Current player data
  const currentPlayer = players.find((p) => p.id === userId);
  const myRole = currentPlayer?.role || "Player";
  const myPlayerStates = currentPlayer?.playerStates || [];
  const myPublicStates = currentPlayer?.publicStates || [];

  // Other players (excluding GM and self)
  const otherPlayers = players.filter((p) => !p.isGM && p.id !== userId);

  // Divine voice modal state
  const [divineVoiceMessage, setDivineVoiceMessage] = useState<string | null>(
    null
  );

  // Sound toast state
  const [soundToast, setSoundToast] = useState<{
    emoji: string;
    name: string;
  } | null>(null);

  // Notification history with localStorage persistence
  const [notificationHistory, setNotificationHistory] = useState<
    NotificationHistoryItem[]
  >(() => {
    // Load from localStorage on init
    try {
      const saved = localStorage.getItem("notificationHistory");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showHistory, setShowHistory] = useState(false);

  // Save notification history to localStorage
  useEffect(() => {
    localStorage.setItem(
      "notificationHistory",
      JSON.stringify(notificationHistory)
    );
  }, [notificationHistory]);

  // Audio refs for all sounds
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  // Process notifications
  useEffect(() => {
    if (!userId || notifications.length === 0) return;

    notifications.forEach(async (notification) => {
      const isForMe =
        notification.targetPlayerId === null ||
        notification.targetPlayerId === userId;
      if (!isForMe) return;

      // Helper to add to history
      const addToHistory = (
        type: NotificationHistoryItem["type"],
        message: string
      ) => {
        setNotificationHistory((prev) => [
          {
            id: notification.id,
            type,
            message,
            timestamp: notification.timestamp,
          },
          ...prev.slice(0, 49), // Keep last 50
        ]);
      };

      switch (notification.type) {
        case "sound":
          const soundId = notification.payload.soundId || "gong";
          const audioEl = audioRefs.current[soundId];
          const soundInfo = getSoundById(soundId);

          if (audioEl && soundInfo) {
            audioEl.currentTime = 0;
            audioEl.play().catch((err) => {
              console.warn(`Failed to play sound ${soundId}:`, err);
              // Show toast even if audio fails
              setSoundToast({ emoji: "🔇", name: `${soundInfo.name} (error)` });
              setTimeout(() => setSoundToast(null), 2500);
            });
            setSoundToast(soundInfo);
            setTimeout(() => setSoundToast(null), 2500);
            addToHistory("sound", `${soundInfo.emoji} ${soundInfo.name}`);
          }
          break;

        case "vibration":
          if (notification.payload.intensity && navigator.vibrate) {
            navigator.vibrate(notification.payload.intensity);
            addToHistory(
              "vibration",
              `Vibración (${notification.payload.intensity}ms)`
            );
          }
          break;

        case "divineVoice":
          if (notification.payload.message) {
            setDivineVoiceMessage(notification.payload.message);
            if ("speechSynthesis" in window) {
              const utterance = new SpeechSynthesisUtterance(
                notification.payload.message
              );
              utterance.lang = "es-ES";
              utterance.rate = 0.9;
              speechSynthesis.speak(utterance);
            }
            addToHistory("divineVoice", notification.payload.message);
          }
          break;

        case "globalMessage":
          if (notification.payload.message) {
            setDivineVoiceMessage(`📢 ${notification.payload.message}`);
            addToHistory("globalMessage", notification.payload.message);
          }
          break;
      }

      await clearNotification(notification.id);
    });
  }, [notifications, userId, clearNotification]);

  // Get status color class
  const getStatusStyle = (states: string[]) => {
    if (states.includes("Muerto")) return { isDead: true, color: "neutral" };
    if (states.includes("Herido")) return { isDead: false, color: "yellow" };
    return { isDead: false, color: "green" };
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Hidden audio elements for all sounds */}
      {SOUNDS.map((sound) => (
        <audio
          key={sound.id}
          ref={(el) => {
            audioRefs.current[sound.id] = el;
          }}
          src={`/sounds/${sound.id}.mp3`}
          preload="auto"
        />
      ))}

      {/* Sound Toast */}
      {soundToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top fade-in duration-300">
          <div className="px-6 py-3 bg-gradient-to-r from-pink-900/90 to-purple-900/90 border border-pink-500/50 rounded-full shadow-2xl shadow-pink-500/30 flex items-center gap-3">
            <span className="text-3xl">{soundToast.emoji}</span>
            <span className="text-white font-bold uppercase tracking-wider">
              {soundToast.name}
            </span>
          </div>
        </div>
      )}

      {/* Notification History Panel */}
      {notificationHistory.length > 0 && (
        <div className="fixed bottom-20 right-4 z-40">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="relative p-3 bg-indigo-600 hover:bg-indigo-500 rounded-full shadow-lg shadow-indigo-900/50 transition-colors"
          >
            <Bell size={20} className="text-white" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {notificationHistory.length}
            </span>
          </button>

          {showHistory && (
            <div className="absolute bottom-14 right-0 w-72 max-h-64 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
              <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                  <History size={14} /> Historial
                </span>
                <button
                  onClick={() => setNotificationHistory([])}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Limpiar
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {notificationHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 border-b border-neutral-800 last:border-0 hover:bg-neutral-800/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {item.type === "sound" && "🔊"}
                        {item.type === "vibration" && "📳"}
                        {item.type === "divineVoice" && "🎭"}
                        {item.type === "globalMessage" && "📢"}
                      </span>
                      <span className="text-sm text-white truncate flex-1">
                        {item.message}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Divine Voice Modal Overlay */}
      {divineVoiceMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative max-w-md mx-4 p-6 bg-gradient-to-b from-indigo-900/80 to-neutral-900 border border-indigo-500/50 rounded-2xl shadow-2xl shadow-indigo-500/20">
            <button
              onClick={() => setDivineVoiceMessage(null)}
              className="absolute top-3 right-3 p-1 text-neutral-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <div className="text-center">
              <div className="inline-flex items-center justify-center p-4 bg-indigo-500/20 rounded-full mb-4 border border-indigo-500/50">
                <Volume2 size={32} className="text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-indigo-400 uppercase tracking-wider mb-3">
                Voz Divina
              </h3>
              <p className="text-xl text-white font-medium leading-relaxed">
                "{divineVoiceMessage}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 1. Central Card: Global State & Role */}
      <section className="relative overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-900 shadow-2xl">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-green-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 grid grid-cols-1 divide-y divide-neutral-800">
          {/* Global State Header */}
          <div className="p-6 text-center bg-neutral-950/50">
            <div className="inline-flex items-center justify-center p-3 bg-neutral-800 rounded-full mb-3 border border-neutral-700">
              <Moon size={24} className="text-indigo-400" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">
              {globalState || "Esperando..."}
            </h2>
          </div>

          {/* My Role Section */}
          <div className="p-6 bg-gradient-to-b from-neutral-900 to-neutral-900/80">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Tu Identidad
              </span>
              <Fingerprint size={16} className="text-green-500" />
            </div>

            <div className="mb-4">
              <h1 className="text-3xl font-black text-green-500 uppercase tracking-tighter">
                {nickname}
              </h1>
              <span className="text-xs bg-green-900/20 text-green-400 px-2 py-1 rounded border border-green-900/50 uppercase font-bold tracking-wide">
                {myRole}
              </span>
            </div>

            {/* My States */}
            {myPlayerStates.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-neutral-500 uppercase mb-2 flex items-center gap-1">
                  <MessageCircle size={12} /> Estados Privados
                </p>
                <div className="flex flex-wrap gap-1">
                  {myPlayerStates.map((state) => (
                    <span
                      key={state}
                      className="px-2 py-1 bg-purple-900/30 text-purple-400 text-xs rounded border border-purple-900/50"
                    >
                      {state}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {myPublicStates.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-neutral-500 uppercase mb-2 flex items-center gap-1">
                  <Eye size={12} /> Estados Públicos
                </p>
                <div className="flex flex-wrap gap-1">
                  {myPublicStates.map((state) => (
                    <span
                      key={state}
                      className="px-2 py-1 bg-blue-900/30 text-blue-400 text-xs rounded border border-blue-900/50"
                    >
                      {state}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Other Players List */}
      <section>
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4 px-1 flex items-center gap-2">
          <Eye size={14} /> Estado Público de Agentes
        </h3>

        <div className="grid gap-2">
          {otherPlayers.length === 0 && (
            <div className="py-8 text-center text-neutral-600 font-mono text-sm border-2 border-dashed border-neutral-800 rounded-xl">
              No hay otros agentes conectados
            </div>
          )}
          {otherPlayers.map((player) => {
            const playerPublicStates = player.publicStates || [];
            const { isDead, color } = getStatusStyle(playerPublicStates);

            return (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all
                          ${
                            isDead
                              ? "bg-neutral-950 border-neutral-900 opacity-60"
                              : "bg-neutral-800 border-neutral-700"
                          }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full border ${
                      isDead
                        ? "bg-neutral-900 border-neutral-800 text-neutral-600"
                        : "bg-neutral-700 border-neutral-600 text-neutral-300"
                    }`}
                  >
                    <User size={16} />
                  </div>
                  <div>
                    <span
                      className={`font-bold block ${
                        isDead
                          ? "text-neutral-500 line-through"
                          : "text-neutral-200"
                      }`}
                    >
                      {player.nickname}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status indicators */}
                  {playerPublicStates.length > 0 ? (
                    <div className="flex gap-1">
                      {playerPublicStates.map((state) => (
                        <span
                          key={state}
                          className={`text-xs font-mono px-2 py-0.5 rounded ${
                            state === "Muerto"
                              ? "bg-neutral-800 text-neutral-500"
                              : state === "Herido"
                              ? "bg-yellow-900/30 text-yellow-400"
                              : "bg-green-900/30 text-green-400"
                          }`}
                        >
                          {state}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <>
                      <span className="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                      <span className="text-xs font-mono text-neutral-500 uppercase">
                        Activo
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default UIPlayer;
