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
import { signInAnonymously, signOut } from "firebase/auth";

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

  restoreAuthSession: async () => {
    // Check if there's a saved session in sessionStorage (F5 recovery)
    const savedId = sessionStorage.getItem("userId");
    const savedNickname = sessionStorage.getItem("nickname");
    const savedIsGM = sessionStorage.getItem("isGM") === "true";

    if (savedId && savedNickname) {
      // Verify if user still exists in Firebase
      try {
        const playerRef = ref(db, `${ROOM_REF}/players/${savedId}`);
        const snapshot = await firebaseGet(playerRef);

        if (snapshot.exists()) {
          // Reconnect with existing session
          await signInAnonymously(auth);

          // Update status to online in Firebase
          await update(playerRef, {
            status: "online",
            lastSeen: Date.now(),
          });

          set({
            user: { nickname: savedNickname, isGM: savedIsGM, id: savedId },
            ui: {
              isChatOpen: false,
              isSync: false,
              currentView: savedIsGM ? "gm" : "patio",
              isLoading: false,
              error: null,
              activeChannel: "global",
            },
          });
          return; // Session restored successfully
        }
      } catch (e) {
        console.error("Error restoring session:", e);
      }

      // User doesn't exist anymore - clear session
      sessionStorage.clear();
    }

    // No valid session - force login
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Error signing out during restore:", e);
    }

    set((state) => ({
      user: {
        nickname: "",
        isGM: false,
        id: null,
      },
      ui: {
        ...state.ui,
        currentView: "login",
        isLoading: false,
        error: null,
      },
    }));
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

      // Save session to sessionStorage (survives F5, not tab close)
      sessionStorage.setItem("userId", uid);
      sessionStorage.setItem("nickname", nickname);
      sessionStorage.setItem("isGM", String(isGM));

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
