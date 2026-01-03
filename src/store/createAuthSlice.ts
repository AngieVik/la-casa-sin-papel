import { StateCreator } from "zustand";
import { AppStore, Player } from "../types";
import { db, auth } from "../firebaseConfig";
import {
  ref,
  set as firebaseSet,
  update,
  remove,
  get as firebaseGet,
  onDisconnect,
} from "firebase/database";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";

const ROOM_REF = "rooms/defaultRoom";

export const createAuthSlice: StateCreator<
  AppStore,
  [],
  [],
  Pick<
    AppStore,
    | "user"
    | "ui"
    | "setNickname"
    | "setGM"
    | "restoreAuthSession"
    | "cleanupOldPlayers"
    | "loginToFirebase"
    | "setCurrentView"
  >
> = (set, get) => ({
  user: {
    nickname: "",
    isGM: false,
    id: null,
  },
  ui: {
    isChatOpen: false,
    isSync: false,
    currentView: "login",
    isLoading: false,
    error: null,
    activeChannel: "global",
  },

  setCurrentView: (view) =>
    set((state) => ({ ui: { ...state.ui, currentView: view } })),

  setNickname: (nickname) =>
    set((state) => ({ user: { ...state.user, nickname } })),

  setGM: (isGM) => set((state) => ({ user: { ...state.user, isGM } })),

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

  cleanupOldPlayers: async () => {
    try {
      const playersRef = ref(db, `${ROOM_REF}/players`);
      const snapshot = await firebaseGet(playersRef);

      if (snapshot.exists()) {
        const players = snapshot.val();
        // Reduce timeout to 10 minutes (10 * 60 * 1000)
        const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

        Object.entries(players).forEach(
          async ([playerId, playerData]: [string, Player]) => {
            if (!playerData.isGM && playerData.status === "offline") {
              const lastSeen = playerData.lastSeen || 0;
              if (lastSeen < tenMinutesAgo) {
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

      // Clear only THIS user's typing status on disconnect
      const userTypingRef = ref(db, `${ROOM_REF}/typing/global/${uid}`);
      onDisconnect(userTypingRef).remove();

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
});
