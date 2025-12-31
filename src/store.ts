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
  isRunning: false,
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
    globalState: "Día",
    tickerText: "Esperando conexión...",
    clockConfig: DEFAULT_CLOCK_CONFIG,
    tickerSpeed: 20,
    channels: { global: [] },
    globalStates: ["Día", "Noche"],
    playerStates: ["Envenenado", "Peruano", "De Viator"],
    publicStates: ["Vivo", "Muerto", "Carcel"],
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

          // Protecci\u00f3n robusta al recibir datos
          return {
            room: {
              ...state.room,
              status: newStatus,
              tickerText: data.ticker || "Sistema en l\u00ednea.",
              clockConfig: data.clockConfig || DEFAULT_CLOCK_CONFIG,
              tickerSpeed: data.tickerSpeed || 20,
              globalState: data.globalState || "Esperando",
              players: playersList,
              messages: channelsData.global || [],
              votes: data.votes || {},
              channels: channelsData,
              gameSelected: data.gameSelected || null,
              globalStates: data.globalStates || ["D\u00eda", "Noche"],
              playerStates: data.playerStates || [
                "Envenenado",
                "Peruano",
                "De Viator",
              ],
              publicStates: data.publicStates || ["Vivo", "Muerto", "Carcel"],
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
      isRunning: false,
    };
    update(ref(db, ROOM_REF), { clockConfig: newConfig });
  },

  gmStartClock: (mode) => {
    const { room } = get();
    const config = room.clockConfig || DEFAULT_CLOCK_CONFIG;

    // If already running, do nothing
    if (config.isRunning) return;

    // Prevent starting countdown if already at 0
    if (mode === "countdown" && config.baseTime <= 0) return;

    const newConfig = {
      mode,
      baseTime: config.baseTime,
      isRunning: true,
    };

    update(ref(db, ROOM_REF), { clockConfig: newConfig });
  },

  gmPauseClock: () => {
    const { room } = get();
    const config = room.clockConfig || DEFAULT_CLOCK_CONFIG;

    if (!config.isRunning) return;

    const newConfig = {
      ...config,
      isRunning: false,
    };

    update(ref(db, ROOM_REF), { clockConfig: newConfig });
  },

  gmResetClock: () => {
    const { room } = get();
    const currentConfig = room.clockConfig || DEFAULT_CLOCK_CONFIG;

    const newConfig = {
      ...currentConfig,
      isRunning: false,
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
      isRunning: false,
    };
    update(ref(db, ROOM_REF), { clockConfig: newConfig });
  },

  // --- NEW: Tick action called every second ---
  clockTick: () => {
    const { room, user } = get();
    const config = room.clockConfig || DEFAULT_CLOCK_CONFIG;

    // Only GM should tick to Firebase to avoid conflicts
    if (!user.isGM) return;
    if (!config.isRunning) return;

    let newBaseTime = config.baseTime;

    if (config.mode === "stopwatch") {
      newBaseTime = config.baseTime + 1;
      // Loop back at 99:59 (5999s)
      if (newBaseTime >= 6000) newBaseTime = 0;
    } else if (config.mode === "countdown") {
      newBaseTime = config.baseTime - 1;
      if (newBaseTime <= 0) {
        // Stop at 0
        update(ref(db, ROOM_REF), {
          clockConfig: { ...config, baseTime: 0, isRunning: false },
        });
        return;
      }
    }

    update(ref(db, ROOM_REF), {
      clockConfig: { ...config, baseTime: newBaseTime },
    });
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

  // --- State Management Actions ---
  gmAddGlobalState: (state: string) => {
    const { room } = get();
    const newStates = [...room.globalStates, state];
    update(ref(db, ROOM_REF), { globalStates: newStates });
  },

  gmEditGlobalState: (oldState: string, newState: string) => {
    const { room } = get();
    const newStates = room.globalStates.map((s) =>
      s === oldState ? newState : s
    );
    update(ref(db, ROOM_REF), { globalStates: newStates });
  },

  gmDeleteGlobalState: (state: string) => {
    const { room } = get();
    const newStates = room.globalStates.filter((s) => s !== state);
    update(ref(db, ROOM_REF), { globalStates: newStates });
  },

  gmAddPlayerStateOption: (state: string) => {
    const { room } = get();
    const newStates = [...room.playerStates, state];
    update(ref(db, ROOM_REF), { playerStates: newStates });
  },

  gmEditPlayerStateOption: (oldState: string, newState: string) => {
    const { room } = get();
    const newStates = room.playerStates.map((s) =>
      s === oldState ? newState : s
    );
    update(ref(db, ROOM_REF), { playerStates: newStates });
  },

  gmDeletePlayerStateOption: (state: string) => {
    const { room } = get();
    const newStates = room.playerStates.filter((s) => s !== state);
    update(ref(db, ROOM_REF), { playerStates: newStates });
  },

  gmAddPublicStateOption: (state: string) => {
    const { room } = get();
    const newStates = [...room.publicStates, state];
    update(ref(db, ROOM_REF), { publicStates: newStates });
  },

  gmEditPublicStateOption: (oldState: string, newState: string) => {
    const { room } = get();
    const newStates = room.publicStates.map((s) =>
      s === oldState ? newState : s
    );
    update(ref(db, ROOM_REF), { publicStates: newStates });
  },

  gmDeletePublicStateOption: (state: string) => {
    const { room } = get();
    const newStates = room.publicStates.filter((s) => s !== state);
    update(ref(db, ROOM_REF), { publicStates: newStates });
  },

  gmAssignPlayerState: async (playerId: string, state: string) => {
    const playerRef = ref(db, `${ROOM_REF}/players/${playerId}`);
    await update(playerRef, { playerState: state });
  },

  gmAssignPublicState: async (playerId: string, state: string) => {
    const playerRef = ref(db, `${ROOM_REF}/players/${playerId}`);
    await update(playerRef, { publicState: state });
  },

  gmSelectGame: async (gameId: string) => {
    await update(ref(db, ROOM_REF), { gameSelected: gameId });
  },
}));
