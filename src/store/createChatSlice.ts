import { StateCreator } from "zustand";
import { AppStore } from "../types";
import { db } from "../firebaseConfig";
import { ref, push, set as firebaseSet, remove } from "firebase/database";

const ROOM_REF = "rooms/defaultRoom";

export const createChatSlice: StateCreator<
  AppStore,
  [],
  [],
  Pick<
    AppStore,
    "toggleChat" | "setActiveChannel" | "sendChatMessage" | "setTyping"
  >
> = (set, get) => ({
  toggleChat: () =>
    set((state) => ({ ui: { ...state.ui, isChatOpen: !state.ui.isChatOpen } })),

  setActiveChannel: (channel) =>
    set((state) => ({ ui: { ...state.ui, activeChannel: channel } })),

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
});
