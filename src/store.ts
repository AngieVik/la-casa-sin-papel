import { create } from "zustand";
import {
  AppStore,
  Player,
  ChatMessage,
  ChatRoom,
  PlayerNotification,
} from "./types";
import { db, auth } from "./firebaseConfig";
import {
  ref,
  set as firebaseSet,
  push,
  onValue,
  update,
  remove,
  get as firebaseGet,
  onDisconnect,
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
    chatRooms: [],
    notifications: [],
    typing: {},
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
        role: isGM ? "Director" : "Player",
        playerStates: [],
        publicStates: [],
        lastSeen: Date.now(),
      });

      // Clear typing status on disconnect
      const typingRef = ref(db, `${ROOM_REF}/typing`);
      onDisconnect(typingRef).remove();

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
              chatRooms: data.chatRooms
                ? Object.entries(data.chatRooms).map(
                    ([key, val]: [string, unknown]) => ({
                      id: key,
                      ...(val as Omit<ChatRoom, "id">),
                    })
                  )
                : [],
              notifications: data.notifications
                ? Object.entries(data.notifications).map(
                    ([key, val]: [string, unknown]) => ({
                      id: key,
                      ...(val as Omit<PlayerNotification, "id">),
                    })
                  )
                : [],
              typing: data.typing || {},
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
    playerStates: string[],
    publicStates: string[]
  ) => {
    const playerRef = ref(db, `${ROOM_REF}/players/${playerId}`);
    await update(playerRef, { playerStates, publicStates });
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
      // Clear chat rooms and notifications
      chatRooms: null,
      notifications: null,
      // Esto sobrescribe CUALQUIER error en la base de datos
      clockConfig: safeClockConfig,
      globalState: "Arrancando sesión...",
      ticker: "Sistema reiniciado. Mantengan la calma.",
    };

    // Reset ALL player data
    room.players.forEach((p) => {
      updates[`players/${p.id}/ready`] = false;
      updates[`players/${p.id}/playerStates`] = [];
      updates[`players/${p.id}/publicStates`] = [];
      updates[`players/${p.id}/role`] = "Player";
    });

    await update(ref(db, ROOM_REF), updates);
  },

  // --- Update Player Role ---
  gmUpdatePlayerRole: async (playerId: string, role: string) => {
    await update(ref(db, `${ROOM_REF}/players/${playerId}`), { role });
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

  gmTogglePlayerState: async (playerId: string, state: string) => {
    const { room } = get();
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    const currentStates = player.playerStates || [];
    let newStates: string[];

    if (currentStates.includes(state)) {
      newStates = currentStates.filter((s) => s !== state);
    } else {
      newStates = [...currentStates, state];
    }

    const playerRef = ref(db, `${ROOM_REF}/players/${playerId}`);
    await update(playerRef, { playerStates: newStates });
  },

  gmTogglePublicState: async (playerId: string, state: string) => {
    const { room } = get();
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    const currentStates = player.publicStates || [];
    let newStates: string[];

    if (currentStates.includes(state)) {
      newStates = currentStates.filter((s) => s !== state);
    } else {
      newStates = [...currentStates, state];
    }

    const playerRef = ref(db, `${ROOM_REF}/players/${playerId}`);
    await update(playerRef, { publicStates: newStates });
  },

  gmSelectGame: async (gameId: string) => {
    await update(ref(db, ROOM_REF), { gameSelected: gameId });
  },

  // --- Notification Actions ---
  gmSendGlobalMessage: async (text: string) => {
    const { user } = get();
    if (!user.id) return;

    const notificationRef = ref(db, `${ROOM_REF}/notifications`);
    await push(notificationRef, {
      type: "globalMessage",
      payload: { message: text },
      targetPlayerId: null,
      timestamp: Date.now(),
    });
  },

  gmSendSound: async (playerId: string | null, soundId: string) => {
    const notificationRef = ref(db, `${ROOM_REF}/notifications`);
    await push(notificationRef, {
      type: "sound",
      payload: { soundId },
      targetPlayerId: playerId,
      timestamp: Date.now(),
    });
  },

  gmSendVibration: async (playerId: string | null, intensity: number) => {
    const notificationRef = ref(db, `${ROOM_REF}/notifications`);
    await push(notificationRef, {
      type: "vibration",
      payload: { intensity },
      targetPlayerId: playerId,
      timestamp: Date.now(),
    });
  },

  gmSendDivineVoice: async (playerId: string | null, text: string) => {
    const notificationRef = ref(db, `${ROOM_REF}/notifications`);
    await push(notificationRef, {
      type: "divineVoice",
      payload: { message: text },
      targetPlayerId: playerId,
      timestamp: Date.now(),
    });
  },

  clearNotification: async (notificationId: string) => {
    const notificationRef = ref(
      db,
      `${ROOM_REF}/notifications/${notificationId}`
    );
    await remove(notificationRef);
  },

  // --- Chat Room Actions ---
  gmCreateChatRoom: async (name: string, playerIds: string[]) => {
    const chatRoomsRef = ref(db, `${ROOM_REF}/chatRooms`);
    await push(chatRoomsRef, {
      name,
      playerIds,
      createdAt: Date.now(),
    });
  },

  gmAddPlayerToRoom: async (roomId: string, playerId: string) => {
    const { room } = get();
    const chatRoom = room.chatRooms.find((r) => r.id === roomId);
    if (!chatRoom) return;

    const newPlayerIds = [...chatRoom.playerIds, playerId];
    const roomRef = ref(db, `${ROOM_REF}/chatRooms/${roomId}`);
    await update(roomRef, { playerIds: newPlayerIds });
  },

  gmRemovePlayerFromRoom: async (roomId: string, playerId: string) => {
    const { room } = get();
    const chatRoom = room.chatRooms.find((r) => r.id === roomId);
    if (!chatRoom) return;

    const newPlayerIds = chatRoom.playerIds.filter((id) => id !== playerId);
    const roomRef = ref(db, `${ROOM_REF}/chatRooms/${roomId}`);
    await update(roomRef, { playerIds: newPlayerIds });
  },

  gmCloseChatRoom: async (roomId: string) => {
    const roomRef = ref(db, `${ROOM_REF}/chatRooms/${roomId}`);
    await remove(roomRef);
    // Also remove the channel messages
    const channelRef = ref(db, `${ROOM_REF}/channels/room_${roomId}`);
    await remove(channelRef);
  },

  // Typing indicator
  setTyping: (channel: string, isTyping: boolean) => {
    const { user } = get();
    if (!user.id) return;

    const typingRef = ref(db, `${ROOM_REF}/typing/${channel}/${user.id}`);
    if (isTyping) {
      // Set timestamp when typing
      firebaseSet(typingRef, Date.now());
    } else {
      // Remove when stopped
      remove(typingRef);
    }
  },
}));
