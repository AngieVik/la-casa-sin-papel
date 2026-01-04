import { StateCreator } from "zustand";
import { AppStore } from "../types";
import { db } from "../firebaseConfig";
import { ref, push, set as firebaseSet, remove } from "firebase/database";

import { ROOM_REF } from "../constants/firebase";

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
    set((state) => {
      const isOpening = !state.ui.isChatOpen;
      const newUnread = isOpening
        ? state.ui.unreadTabs.filter((t) => t !== state.ui.activeTab)
        : state.ui.unreadTabs;
      return {
        ui: {
          ...state.ui,
          isChatOpen: isOpening,
          unreadTabs: newUnread,
        },
      };
    }),

  setActiveChannel: (tab) =>
    set((state) => ({
      ui: {
        ...state.ui,
        activeTab: tab,
        unreadTabs: state.ui.unreadTabs.filter((t) => t !== tab),
      },
    })),

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
