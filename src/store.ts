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
    clockConfig: {
      mode: "static" as const,
      baseTime: 0,
      startTime: null,
      pausedAt: null,
    },
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
            // Usuario ya logueado, recuperar datos de Firebase Database
            const uid = firebaseUser.uid;
            const playerRef = ref(db, `${ROOM_REF}/players/${uid}`);
            const snapshot = await firebaseGet(playerRef);

            if (snapshot.exists()) {
              const playerData = snapshot.val();

              // Actualizar estado a 'online'
              await update(playerRef, { status: "online" });

              // Restaurar estado del store
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

              // Si es GM, limpiar jugadores antiguos
              if (playerData.isGM) {
                get().cleanupOldPlayers();
              }
            } else {
              // El usuario existe en Auth pero no en Database, forzar re-login
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
          // No hay usuario logueado
          set((state) => ({
            ui: { ...state.ui, currentView: "login", isLoading: false },
          }));
        }
        resolve();
      });
    });
  },

  // --- Cleanup: Remove old offline players ---
  cleanupOldPlayers: async () => {
    try {
      const playersRef = ref(db, `${ROOM_REF}/players`);
      const snapshot = await firebaseGet(playersRef);

      if (snapshot.exists()) {
        const players = snapshot.val();
        const oneHourAgo = Date.now() - 60 * 60 * 1000;

        Object.entries(players).forEach(
          async ([playerId, playerData]: [string, any]) => {
            // No borrar GMs y solo borrar si llevan offline más de 1 hora
            if (!playerData.isGM && playerData.status === "offline") {
              const lastSeen = playerData.lastSeen || 0;
              if (lastSeen < oneHourAgo) {
                console.log(`Removing old player: ${playerData.nickname}`);
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

  // --- Firebase: Login ---
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

      // Si es GM, limpiar jugadores antiguos
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

  // --- Firebase: Realtime Sync ---
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

        // Parse channels
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

        // Legacy chat support -> migrate to global channel
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

          return {
            room: {
              ...state.room,
              status: newStatus,
              tickerText: data.ticker || "Sistema en línea.",
              clockConfig: data.clockConfig || {
                mode: "static" as const,
                startTime: null,
                pausedAt: null,
                duration: 0,
              },
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

  // --- Firebase: Chat ---
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

  // --- GM Clock Actions (Sports Scoreboard Logic) ---
  gmSetBaseTime: (seconds) => {
    // ESTA ACCIÓN ES DESTRUCTIVA: Reinicia el reloj con una nueva base
    const newConfig = {
      mode: "static" as const,
      baseTime: seconds,
      startTime: null,
      pausedAt: null,
    };
    update(ref(db, ROOM_REF), { clockConfig: newConfig });
  },

  gmStartClock: (mode) => {
    const { room } = get();
    const config = room.clockConfig;

    let newConfig;

    if (config.startTime === null && config.pausedAt === null) {
      // Caso 1: Primera vez que arranca desde parado
      newConfig = {
        ...config,
        mode,
        startTime: Date.now(),
        pausedAt: null,
      };
    } else if (config.pausedAt !== null) {
      // Caso 2: Reanudar desde pausa (RESUME)
      // Calculamos cuánto tiempo "corrió" antes de la pausa
      const previousRunTime = (config.pausedAt - config.startTime!) / 1000;

      // Actualizamos el baseTime para "quemar" ese tiempo ya transcurrido
      // y reiniciamos el startTime a AHORA. Esto evita deriva temporal.
      let newBaseTime = config.baseTime;
      
      // Si era cuenta atrás, el nuevo base es lo que quedaba
      if (config.mode === "countdown") {
        newBaseTime = Math.max(0, config.baseTime - previousRunTime);
      } 
      // Si era cronómetro, el nuevo base es lo que ya llevábamos acumulado
      else if (config.mode === "stopwatch") {
        newBaseTime = config.baseTime + previousRunTime;
      }

      // IMPORTANTE: Al reanudar, cambiamos al modo solicitado (mode argument)
      // Esto permite pausar una cuenta atrás y reanudarla como cronómetro si se quisiera
      newConfig = {
        mode: mode, // Usar el modo nuevo solicitado
        baseTime: newBaseTime,
        startTime: Date.now(), // Nuevo punto de partida
        pausedAt: null,
      };
    } else {
      // Ya está corriendo, no hacer nada para evitar reseteos accidentales
      return;
    }

    update(ref(db, ROOM_REF), { clockConfig: newConfig });
  },

  gmPauseClock: () => {
    const { room } = get();
    const config = room.clockConfig;

    // Solo pausar si está corriendo (startTime existe y no está ya pausado)
    if (config.startTime === null || config.pausedAt !== null) return;

    const newConfig = {
      ...config,
      pausedAt: Date.now(),
    };

    update(ref(db, ROOM_REF), { clockConfig: newConfig });
  },

  gmResetClock: () => {
    const { room } = get();
    // Resetea solo el estado de ejecución, manteniendo el baseTime actual (o el remanente)
    const newConfig = {
      ...room.clockConfig,
      startTime: null,
      pausedAt: null,
    };
    update(ref(db, ROOM_REF), { clockConfig: newConfig });
  },

  gmSetStaticTime: (timeString: string) => {
    // Convert MM:SS to seconds
    const [minutes, seconds] = timeString.split(":").map(Number);
    const totalSeconds = minutes * 60 + seconds;

    // FIX CRÍTICO: Al editar manualmente, forzamos un RESET COMPLETO del estado.
    // Esto evita que se mezcle el tiempo nuevo con un 'startTime' antiguo.
    const newConfig = {
      mode: "static" as const,
      baseTime: totalSeconds,
      startTime: null, // Reset: el reloj se detiene
      pausedAt: null,  // Reset: quitamos pausas antiguas
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

  gmResetRoom: async () => {
    const { room } = get();
    const updates: Record<string, unknown> = {
      status: "waiting",
      channels: null,
      votes: null,
      clockConfig: {
        mode: "static",
        baseTime: 0,
        startTime: null,
        pausedAt: null,
      },
      globalState: "Día 1: Planificación",
    };

    room.players.forEach((p) => {
      updates[`players/${p.id}/ready`] = false;
      updates[`players/${p.id}/playerState`] = "";
      updates[`players/${p.id}/publicState`] = "";
    });

    await update(ref(db, ROOM_REF), updates);
  },
}));