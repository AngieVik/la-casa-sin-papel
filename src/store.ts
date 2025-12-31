import { create } from "zustand";
import { AppStore, Player, ChatMessage } from "./types";
import { db, auth } from "./firebaseConfig";
import {
  ref,
  set as firebaseSet,
  push,
  onValue,
  update,
  remove,
  get as firebaseGet,
} from "firebase/database";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";

const ROOM_REF = "rooms/defaultRoom";

// --- CONSTANTE DE SEGURIDAD PARA EL RELOJ ---
const DEFAULT_CLOCK_CONFIG = {
  mode: "static" as const,
  baseTime: 0,
  startTime: null,
  pausedAt: null,
};

export const useStore = create<AppStore>((set, get) => ({
  user: {
    nickname: "",
    isGM: false,
    id: null,
  },
  room: {
    status: "waiting",
    gameSelected: null,
    players: [],
    messages: [],
    votes: {},
    globalState: "Día 1: Planificación",
    tickerText: "Esperando conexión...",
    clockConfig: DEFAULT_CLOCK_CONFIG, // Usamos la constante aquí
    tickerSpeed: 20,
    channels: { global: [] },
  },
  ui: {
    isChatOpen: false,
    isSync: false,
    currentView: "login",
    isLoading: false,
    error: null,
    activeChannel: "global",
  },

  // --- UI Actions ---
  toggleChat: () =>
    set((state) => ({ ui: { ...state.ui, isChatOpen: !state.ui.isChatOpen } })),

  setCurrentView: (view) =>
    set((state) => ({ ui: { ...state.ui, currentView: view } })),

  setNickname: (nickname) =>
    set((state) => ({ user: { ...state.user, nickname } })),

  setGM: (isGM) => set((state) => ({ user: { ...state.user, isGM } })),

  setActiveChannel: (channel) =>
    set((state) => ({ ui: { ...state.ui, activeChannel: channel } })),

  // --- Firebase: Auth Persistence ---
  restoreAuthSession: () => {
    return new Promise<void>((resolve) => {
      set((state) => ({ ui: { ...state.ui, isLoading: true } }));

      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const uid = firebaseUser.uid;
            const playerRef = ref(db, `${ROOM_REF}/players/${uid}`);
            const snapshot = await firebaseGet(playerRef);

            if (snapshot.exists()) {
              const playerData = snapshot.val();
              await update(playerRef, { status: "online" });

              set({
                user: {
                  nickname: playerData.nickname,
                  isGM: playerData.isGM,
                  id: uid,
                },
                ui: {
                  isChatOpen: false,
                  isSync: false,
                  currentView: playerData.isGM ? "gm" : "patio",
                  isLoading: false,
                  error: null,
                  activeChannel: "global",
                },
              });

              if (playerData.isGM) {
                get().cleanupOldPlayers();
              }
            } else {
              set((state) => ({
                ui: { ...state.ui, currentView: "login", isLoading: false },
              }));
            }
          } catch (error) {
            console.error("Error restoring session:", error);
            set((state) => ({
              ui: { ...state.ui, currentView: "login", isLoading: false },
            }));
          }
        } else {
          set((state) => ({
            ui: { ...state.ui, currentView: "login", isLoading: false },
          }));
        }
        resolve();
      });
    });
  },

  // --- Cleanup ---
  cleanupOldPlayers: async () => {
    try {
      const playersRef = ref(db, `${ROOM_REF}/players`);
      const snapshot = await firebaseGet(playersRef);

      if (snapshot.exists()) {
        const players = snapshot.val();
        const oneHourAgo = Date.now() - 60 * 60 * 1000;

        Object.entries(players).forEach(
          async ([playerId, playerData]: [string, any]) => {
            if (!playerData.isGM && playerData.status === "offline") {
              const lastSeen = playerData.lastSeen || 0;
              if (lastSeen < oneHourAgo) {
                await remove(ref(db, `${ROOM_REF}/players/${playerId}`));
              }
            }
          }
        );
      }
    } catch (error) {
      console.error("Error cleaning up old players:", error);
    }
  },

  // --- Login ---
  loginToFirebase: async (nickname, isGM) => {
    set((state) => ({ ui: { ...state.ui, isLoading: true, error: null } }));

    try {
      const userCredential = await signInAnonymously(auth);
      const uid = userCredential.user.uid;

      set({
        user: { nickname, isGM, id: uid },
        ui: {
          isChatOpen: false,
          isSync: false,
          currentView: isGM ? "gm" : "patio",
          isLoading: false,
          error: null,
          activeChannel: "global",
        },
      });

      const playerRef = ref(db, `${ROOM_REF}/players/${uid}`);
      await firebaseSet(playerRef, {
        nickname,
        isGM,
        status: "online",
        ready: false,
        role: isGM ? "Director" : "Agente",
        playerState: "",
        publicState: "",
        lastSeen: Date.now(),
      });

      if (isGM) {
        get().cleanupOldPlayers();
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      console.error("Login Error:", error);
      set((state) => ({
        ui: { ...state.ui, isLoading: false, error: errorMessage },
      }));
    }
  },

  // --- Sync ---
  subscribeToRoom: () => {
    const state = get();
    if (state.ui.isSync) return;

    const roomRef = ref(db, ROOM_REF);

    onValue(roomRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const playersList: Player[] = data.players
          ? Object.entries(data.players).map(
              ([key, val]: [string, unknown]) => ({
                id: key,
                ...(val as Omit<Player, "id">),
              })
            )
          : [];

        const channelsData: Record<string, ChatMessage[]> = {};
        if (data.channels) {
          Object.entries(data.channels).forEach(([channelName, messages]) => {
            if (messages && typeof messages === "object") {
              channelsData[channelName] = Object.entries(
                messages as Record<string, unknown>
              ).map(([key, val]: [string, unknown]) => ({
                id: key,
                ...(val as Omit<ChatMessage, "id">),
              }));
            }
          });
        }

        const legacyMessages: ChatMessage[] = data.chat
          ? Object.entries(data.chat).map(([key, val]: [string, unknown]) => ({
              id: key,
              ...(val as Omit<ChatMessage, "id">),
            }))
          : [];
        if (legacyMessages.length > 0 && !channelsData.global) {
          channelsData.global = legacyMessages;
        }

        set((state) => {
          const newStatus = data.status || "waiting";
          const oldStatus = state.room.status;
          const isGM = state.user.isGM;
          let nextView = state.ui.currentView;

          if (!isGM && oldStatus !== newStatus) {
            if (newStatus === "playing") {
              nextView = "player";
            } else if (newStatus === "waiting") {
              nextView = "patio";
            }
          }

          // Protección robusta al recibir datos
          return {
            room: {
              ...state.room,
              status: newStatus,
              tickerText: data.ticker || "Sistema en línea.",
              clockConfig: data.clockConfig || DEFAULT_CLOCK_CONFIG, 
              tickerSpeed: data.tickerSpeed || 20,
              globalState: data.globalState || "Esperando",
              players: playersList,
              messages: channelsData.global || [],
              votes: data.votes || {},
              channels: channelsData,
            },
            ui: {
              ...state.ui,
              isSync: true,
              currentView: nextView,
            },
          };
        });
      }
    });
  },

  // --- Chat ---
  sendChatMessage: async (text, channel = "global") => {
    const { user } = get();
    if (!user.id || !text.trim()) return;

    const chatRef = ref(db, `${ROOM_REF}/channels/${channel}`);
    await push(chatRef, {
      user: user.nickname,
      text,
      role: user.isGM ? "gm" : "player",
      timestamp: Date.now(),
      channel,
    });
  },

  updatePlayerStatus: async (ready) => {
    const { user } = get();
    if (!user.id) return;
    const playerRef = ref(db, `${ROOM_REF}/players/${user.id}`);
    await update(playerRef, { ready });
  },

  voteForGame: async (gameId) => {
    const { user, room } = get();
    if (!user.id) return;

    const votesRef = ref(db, `${ROOM_REF}/votes`);
    const newVotes = { ...room.votes };

    Object.keys(newVotes).forEach((gId) => {
      if (newVotes[gId] && newVotes[gId][user.id!]) {
        const updatedGameVotes = { ...newVotes[gId] };
        delete updatedGameVotes[user.id!];
        newVotes[gId] = updatedGameVotes;
      }
    });

    const currentGameVotes = { ...(room.votes[gameId] || {}) };
    const hadVoted = !!currentGameVotes[user.id!];

    if (hadVoted) {
      delete currentGameVotes[user.id!];
    } else {
      currentGameVotes[user.id!] = true;
    }

    newVotes[gameId] = currentGameVotes;
    await firebaseSet(votesRef, newVotes);
  },

  gmUpdateTicker: (text) => {
    update(ref(db, ROOM_REF), { ticker: text });
  },

  gmUpdateGlobalState: (state) => {
    update(ref(db, ROOM_REF), { globalState: state });
  },

  // --- GM Clock Actions ---
  gmSetBaseTime: (seconds) => {
    const safeSeconds = isNaN(seconds) ? 0 : seconds;
    const newConfig = {
      mode: "static" as const,
      baseTime: safeSeconds,
      startTime: null,
      pausedAt: null,
    };
    update(ref(db, ROOM_REF), { clockConfig: newConfig });
  },

  gmStartClock: (mode) => {
    const { room } = get();
    const config = room.clockConfig || DEFAULT_CLOCK_CONFIG;

    const isStartTimeValid =
      config.startTime !== null && !isNaN(config.startTime);
    const isPausedAtValid =
      config.pausedAt !== null && !isNaN(config.pausedAt);

    const currentBaseTime = isNaN(config.baseTime) ? 0 : config.baseTime;

    let newConfig;

    if (!isStartTimeValid && !isPausedAtValid) {
      // Caso 1: Estaba parado. INICIAR.
      newConfig = {
        ...config,
        mode,
        baseTime: currentBaseTime,
        startTime: Date.now(),
        pausedAt: null,
      };
    } else if (isPausedAtValid) {
      // Caso 2: Estaba pausado. REANUDAR.
      const startRef = isStartTimeValid ? config.startTime! : config.pausedAt!;
      const previousRunTime = (config.pausedAt! - startRef) / 1000;

      const safePreviousRunTime = isNaN(previousRunTime) ? 0 : previousRunTime;

      let newBaseTime = currentBaseTime;

      if (config.mode === "countdown") {
        newBaseTime = Math.max(0, currentBaseTime - safePreviousRunTime);
      } else if (config.mode === "stopwatch") {
        newBaseTime = currentBaseTime + safePreviousRunTime;
      }

      newConfig = {
        mode: mode,
        baseTime: newBaseTime,
        startTime: Date.now(),
        pausedAt: null,
      };
    } else {
      // Caso 3: Ya está corriendo.
      return;
    }

    update(ref(db, ROOM_REF), { clockConfig: newConfig });
  },

  gmPauseClock: () => {
    const { room } = get();
    const config = room.clockConfig || DEFAULT_CLOCK_CONFIG;

    const isStartTimeValid =
      config.startTime !== null && !isNaN(config.startTime);
    const isPausedAtValid =
      config.pausedAt !== null && !isNaN(config.pausedAt);

    if (!isStartTimeValid || isPausedAtValid) return;

    const newConfig = {
      ...config,
      pausedAt: Date.now(),
    };

    update(ref(db, ROOM_REF), { clockConfig: newConfig });
  },

  gmResetClock: () => {
    const { room } = get();
    const currentConfig = room.clockConfig || DEFAULT_CLOCK_CONFIG;

    const newConfig = {
      ...currentConfig,
      startTime: null,
      pausedAt: null,
    };
    update(ref(db, ROOM_REF), { clockConfig: newConfig });
  },

  gmSetStaticTime: (timeString: string) => {
    if (!timeString) timeString = "00:00";

    const parts = timeString.split(":").map((v) => parseInt(v, 10));
    const minutes = isNaN(parts[0]) ? 0 : parts[0];
    const seconds = isNaN(parts[1]) ? 0 : parts[1];
    const totalSeconds = minutes * 60 + seconds;

    const newConfig = {
      mode: "static" as const,
      baseTime: totalSeconds,
      startTime: null,
      pausedAt: null,
    };
    update(ref(db, ROOM_REF), { clockConfig: newConfig });
  },

  gmSetTickerSpeed: (speed: number) => {
    update(ref(db, ROOM_REF), { tickerSpeed: speed });
  },

  gmStartGame: async (gameId) => {
    await update(ref(db, ROOM_REF), {
      status: "playing",
      gameSelected: gameId,
    });
  },

  gmEndGame: async () => {
    const { room } = get();
    const updates: Record<string, unknown> = {
      status: "waiting",
      channels: null,
    };

    room.players.forEach((p) => {
      updates[`players/${p.id}/ready`] = false;
    });

    await update(ref(db, ROOM_REF), updates);
  },

  gmKickPlayer: async (playerId: string) => {
    const playerRef = ref(db, `${ROOM_REF}/players/${playerId}`);
    await update(playerRef, { ready: false });
  },

  gmRemovePlayer: async (playerId: string) => {
    const playerRef = ref(db, `${ROOM_REF}/players/${playerId}`);
    await remove(playerRef);
  },

  gmUpdatePlayerState: async (
    playerId: string,
    playerState: string,
    publicState: string
  ) => {
    const playerRef = ref(db, `${ROOM_REF}/players/${playerId}`);
    await update(playerRef, { playerState, publicState });
  },

  gmWhisper: async (playerId: string, text: string) => {
    const { user } = get();
    if (!user.id) return;

    const channelName = `private_${playerId}`;
    const chatRef = ref(db, `${ROOM_REF}/channels/${channelName}`);
    await push(chatRef, {
      user: user.nickname,
      text,
      role: "gm",
      timestamp: Date.now(),
      channel: channelName,
    });
  },

  // --- BOTÓN NUCLEAR DE LIMPIEZA ---
  gmResetRoom: async () => {
    const { room } = get();
    
    // Usamos la constante segura para forzar una limpieza real
    const safeClockConfig = DEFAULT_CLOCK_CONFIG;

    const updates: Record<string, unknown> = {
      status: "waiting",
      channels: null,
      votes: null,
      // Esto sobrescribe CUALQUIER error en la base de datos
      clockConfig: safeClockConfig,
      globalState: "Arrancando sesión...",
      ticker: "Sistema reiniciado. Mantengan la calma.",
    };

    room.players.forEach((p) => {
      updates[`players/${p.id}/ready`] = false;
      updates[`players/${p.id}/playerState`] = "";
      updates[`players/${p.id}/publicState`] = "";
    });

    await update(ref(db, ROOM_REF), updates);
  },
}));