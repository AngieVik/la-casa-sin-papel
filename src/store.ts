import { create } from "zustand";
import { AppStore } from "./types";
import { createAuthSlice } from "./store/createAuthSlice";
import { createChatSlice } from "./store/createChatSlice";
import { createGameSlice } from "./store/createGameSlice";
import { createGMSlice } from "./store/createGMSlice";

export const useStore = create<AppStore>()((...a) => ({
  ...createAuthSlice(...a),
  ...createChatSlice(...a),
  ...createGameSlice(...a),
  ...createGMSlice(...a),
}));
