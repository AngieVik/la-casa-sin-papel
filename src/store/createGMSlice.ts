import { StateCreator } from "zustand";
import { AppStore } from "../types";
import { db } from "../firebaseConfig";
import {
  ref,
  update,
  push,
  remove,
  set as firebaseSet,
} from "firebase/database";
import { DEFAULT_CLOCK_CONFIG } from "./createGameSlice";

const ROOM_REF = "rooms/defaultRoom";

export const createGMSlice: StateCreator<
  AppStore,
  [],
  [],
  Pick<
    AppStore,
    | "gmUpdateTicker"
    | "gmUpdateGlobalState"
    | "gmSetBaseTime"
    | "gmStartClock"
    | "gmPauseClock"
    | "gmResetClock"
    | "gmSetStaticTime"
    | "gmSetTickerSpeed"
    | "gmStartGame"
    | "gmEndGame"
    | "gmKickPlayer"
    | "gmRemovePlayer"
    | "gmUpdatePlayerState"
    | "gmWhisper"
    | "gmResetRoom"
    | "gmUpdatePlayerRole"
    | "gmAddGlobalState"
    | "gmEditGlobalState"
    | "gmDeleteGlobalState"
    | "gmAddPlayerStateOption"
    | "gmEditPlayerStateOption"
    | "gmDeletePlayerStateOption"
    | "gmAddPublicStateOption"
    | "gmEditPublicStateOption"
    | "gmDeletePublicStateOption"
    | "gmTogglePlayerState"
    | "gmTogglePublicState"
    | "gmSelectGame"
    | "gmAddRole"
    | "gmEditRole"
    | "gmDeleteRole"
    | "gmSendGlobalMessage"
    | "gmSendSound"
    | "gmSendVibration"
    | "gmSendDivineVoice"
    | "clearNotification"
    | "gmCreateChatRoom"
    | "gmAddPlayerToRoom"
    | "gmRemovePlayerFromRoom"
    | "gmCloseChatRoom"
  >
> = (set, get) => ({
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
    if (config.isRunning) return; // Ya está corriendo

    const now = Date.now();

    // Si venimos de una pausa, ajustamos el startTime para no perder el tiempo que ya pasó
    let newStartTime = now;
    if (config.pausedAt && config.startTime) {
      const timePaused = config.pausedAt - config.startTime;
      newStartTime = now - timePaused;
    }

    update(ref(db, ROOM_REF), {
      clockConfig: {
        mode,
        baseTime: config.baseTime,
        isRunning: true,
        startTime: newStartTime,
        pausedAt: null,
      },
    });
  },

  gmPauseClock: () => {
    const { room } = get();
    const config = room.clockConfig || DEFAULT_CLOCK_CONFIG;
    if (!config.isRunning) return;

    update(ref(db, ROOM_REF), {
      clockConfig: {
        ...config,
        isRunning: false,
        pausedAt: Date.now(), // Guardamos cuándo se pausó
      },
    });
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
      startTime: null,
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

  gmResetRoom: async () => {
    // Definir estado inicial limpio para sobrescribir TODO
    const initialRoomState = {
      status: "waiting",
      // No channels, chatRooms, votes, notifications
      channels: null,
      chatRooms: null,
      votes: null,
      notifications: null,
      clockConfig: {
        ...DEFAULT_CLOCK_CONFIG,
        mode: "static",
        baseTime: 0,
        isRunning: false,
      },
      globalState: "Arrancando sesión...",
      ticker: "Sistema reiniciado. Mantengan la calma.",
      // Players object will be constructed below to keep only basics
      players: {},
      // Keep definitions but clear usage if needed?
      // The requirement says "sobrescribir completamente".
      // But we probably want to keep the players logged in, just reset their state.
    };

    const { room } = get();

    // Construct the players object to preserve connected users but reset their game state
    const resetPlayers: Record<string, any> = {};
    room.players.forEach((p) => {
      resetPlayers[p.id] = {
        ...p,
        ready: false,
        playerStates: [],
        publicStates: [],
        role: "Player", // Reset role to default
        // Preserve nickname, isGM, id, status, lastSeen
      };
    });

    // Merge players into the initial state
    const stateToSet = {
      ...initialRoomState,
      players: resetPlayers,
      // Preserve option lists if desired, otherwise they rely on default code values if they are hardcoded.
      // Assuming dynamic lists should be preserved or reset?
      // "sobrescribir completamente el nodo rooms/defaultRoom, garantizando que no queden datos basura"
      // If we want to keep the *definitions* (like roles list, states list), we should copy them from current state
      // OR reset them to defaults.
      // Let's assume we keep the configurations (roles, globalStates options, etc) but reset the *gameplay* elements.
      // However, the prompt says "garantizando que no queden datos basura".
      // Let's keep the lists (roles, globalStates, playerStates options, publicStates options)
      // so the GM doesn't lose their customized lists, but reset the *values*.
      roles: room.roles,
      globalStates: room.globalStates,
      playerStates: room.playerStates,
      publicStates: room.publicStates,
    };

    await firebaseSet(ref(db, ROOM_REF), stateToSet);
  },

  gmUpdatePlayerRole: async (playerId: string, role: string) => {
    await update(ref(db, `${ROOM_REF}/players/${playerId}`), { role });
  },

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

  gmSelectGame: async (gameId: string | null) => {
    await update(ref(db, ROOM_REF), { gameSelected: gameId });
  },

  gmAddRole: (role: string) => {
    const { room } = get();
    const newRoles = [...room.roles, role];
    update(ref(db, ROOM_REF), { roles: newRoles });
  },

  gmEditRole: (oldRole: string, newRole: string) => {
    const { room } = get();
    const newRoles = room.roles.map((r) => (r === oldRole ? newRole : r));
    update(ref(db, ROOM_REF), { roles: newRoles });
    // Also update any players with this role
    room.players.forEach((player) => {
      if (player.role === oldRole) {
        update(ref(db, `${ROOM_REF}/players/${player.id}`), { role: newRole });
      }
    });
  },

  gmDeleteRole: (role: string) => {
    const { room } = get();
    const newRoles = room.roles.filter((r) => r !== role);
    update(ref(db, ROOM_REF), { roles: newRoles });
    // Reset any players with this role to default
    room.players.forEach((player) => {
      if (player.role === role) {
        update(ref(db, `${ROOM_REF}/players/${player.id}`), {
          role: "Jugador",
        });
      }
    });
  },

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
});
