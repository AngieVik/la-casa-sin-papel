import { create } from 'zustand';
import { AppStore, Player, ChatMessage } from './types';
import { db, auth } from './firebaseConfig';
import { ref, set, push, onValue, update } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';

const ROOM_REF = 'rooms/defaultRoom';

export const useStore = create<AppStore>((set, get) => ({
  user: {
    nickname: '',
    isGM: false,
    id: null,
  },
  room: {
    gameSelected: null,
    players: [],
    messages: [],
    globalState: 'Día 1: Planificación',
    tickerText: 'Esperando conexión...',
    gameClock: '00:00',
  },
  ui: {
    isChatOpen: false,
    isSync: false,
    currentView: 'login',
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

  setGM: (isGM) => 
    set((state) => ({ user: { ...state.user, isGM } })),

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
          currentView: isGM ? 'gm' : 'patio',
          isLoading: false,
          error: null
        } 
      });

      // Write User to DB
      const playerRef = ref(db, `${ROOM_REF}/players/${uid}`);
      await set(playerRef, {
        nickname,
        isGM,
        status: 'online',
        ready: false,
        role: isGM ? 'Director' : 'Agente'
      });

    } catch (error: any) {
      console.error("Login Error:", error);
      set((state) => ({ ui: { ...state.ui, isLoading: false, error: error.message } }));
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
              ...val
            }))
          : [];

        // 2. Parse Chat Object to Array
        const messagesList: ChatMessage[] = data.chat 
          ? Object.entries(data.chat).map(([key, val]: [string, any]) => ({
              id: key,
              ...val
            }))
          : [];

        // Update Store
        set((state) => ({
          room: {
            ...state.room,
            tickerText: data.ticker || 'Sistema en línea.',
            gameClock: data.clock || '00:00',
            globalState: data.globalState || 'Esperando',
            players: playersList,
            messages: messagesList,
          },
          ui: { ...state.ui, isSync: true }
        }));
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
      role: user.isGM ? 'gm' : 'player',
      timestamp: Date.now(),
    });
  },

  updatePlayerStatus: async (ready) => {
    const { user } = get();
    if (!user.id) return;
    
    const playerRef = ref(db, `${ROOM_REF}/players/${user.id}`);
    await update(playerRef, { ready });
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
  }
}));