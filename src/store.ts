import { create } from "zustand";
import { AppStore, Player, ChatMessage } from "./types";
import { db, auth } from "./firebaseConfig";
import {
  ref,
  set as firebaseSet,
  push,
  onValue,
  update,
} from "firebase/database";
import { signInAnonymously } from "firebase/auth";

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
    gameClock: "00:00",
  },
  ui: {
    isChatOpen: false,
    isSync: false,
    currentView: "login",
    isLoading: false,
    error: null,
  },

  // --- UI Actions ---
  toggleChat: () =>
    set((state) => ({ ui: { ...state.ui, isChatOpen: !state.ui.isChatOpen } })),

  setCurrentView: (view) =>
    set((state) => ({ ui: { ...state.ui, currentView: view } })),

  setNickname: (nickname) =>
    set((state) => ({ user: { ...state.user, nickname } })),

  setGM: (isGM) => set((state) => ({ user: { ...state.user, isGM } })),

  // --- Firebase: Login ---
  loginToFirebase: async (nickname, isGM) => {
    set((state) => ({ ui: { ...state.ui, isLoading: true, error: null } }));

    try {
      const userCredential = await signInAnonymously(auth);
      const uid = userCredential.user.uid;

      // Update local User State
      set({
        user: { nickname, isGM, id: uid },
        ui: {
          isChatOpen: false,
          isSync: false,
          currentView: isGM ? "gm" : "patio",
          isLoading: false,
          error: null,
        },
      });

      // Write User to DB
      const playerRef = ref(db, `${ROOM_REF}/players/${uid}`);
      await firebaseSet(playerRef, {
        nickname,
        isGM,
        status: "online",
        ready: false,
        role: isGM ? "Director" : "Agente",
      });
    } catch (error: any) {
      console.error("Login Error:", error);
      set((state) => ({
        ui: { ...state.ui, isLoading: false, error: error.message },
      }));
    }
  },

  // --- Firebase: Realtime Sync (Listeners) ---
  subscribeToRoom: () => {
    const state = get();
    if (state.ui.isSync) return; // Prevent double subscription

    const roomRef = ref(db, ROOM_REF);

    onValue(roomRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        // 1. Parse Players Object to Array
        const playersList: Player[] = data.players
          ? Object.entries(data.players).map(([key, val]: [string, any]) => ({
              id: key,
              ...val,
            }))
          : [];

        // 2. Parse Chat Object to Array
        const messagesList: ChatMessage[] = data.chat
          ? Object.entries(data.chat).map(([key, val]: [string, any]) => ({
              id: key,
              ...val,
            }))
          : [];

        // Update Store
        set((state) => {
          const newStatus = data.status || "waiting";
          const oldStatus = state.room.status;
          const isGM = state.user.isGM;
          let nextView = state.ui.currentView;

          // Auto-Transition Logic for Players
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
              gameClock: data.clock || "00:00",
              globalState: data.globalState || "Esperando",
              players: playersList,
              messages: messagesList,
              votes: data.votes || {},
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

  // --- Firebase: Writes ---

  sendChatMessage: async (text) => {
    const { user } = get();
    if (!user.id || !text.trim()) return;

    const chatRef = ref(db, `${ROOM_REF}/chat`);
    await push(chatRef, {
      user: user.nickname,
      text,
      role: user.isGM ? "gm" : "player",
      timestamp: Date.now(),
    });
  },

  updatePlayerStatus: async (ready) => {
    const { user } = get();
    if (!user.id) return;

    const playerRef = ref(db, `${ROOM_REF}/players/${user.id}`);
    await update(playerRef, { ready });
  },

  voteForGame: async (gameId) => {
    const votesRef = ref(db, `${ROOM_REF}/votes`);
    // Usamos update con un incremento atómico si fuera posible,
    // pero para simplicidad aquí leemos el estado actual o usamos una estructura flat
    const { room } = get();
    const currentVotes = room.votes[gameId] || 0;
    await update(votesRef, { [gameId]: currentVotes + 1 });
  },

  // --- GM Actions (Direct Writes) ---

  gmUpdateTicker: (text) => {
    update(ref(db, ROOM_REF), { ticker: text });
  },

  gmUpdateClock: (time) => {
    update(ref(db, ROOM_REF), { clock: time });
  },

  gmUpdateGlobalState: (state) => {
    update(ref(db, ROOM_REF), { globalState: state });
  },

  gmStartGame: async (gameId) => {
    await update(ref(db, ROOM_REF), {
      status: "playing",
      gameSelected: gameId,
    });
  },

  gmEndGame: async () => {
    const { room } = get();
    const updates: any = {
      status: "waiting",
      chat: null, // Clear chat
    };

    // Clear players ready status
    room.players.forEach((p) => {
      updates[`players/${p.id}/ready`] = false;
    });

    await update(ref(db, ROOM_REF), updates);
  },
}));
