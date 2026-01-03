import { StateCreator } from "zustand";
import {
  AppStore,
  Player,
  ChatMessage,
  ChatRoom,
  PlayerNotification,
} from "../types";
import { db } from "../firebaseConfig";
import { ref, onValue, update, set as firebaseSet } from "firebase/database";

const ROOM_REF = "rooms/defaultRoom";

export const DEFAULT_CLOCK_CONFIG = {
  mode: "static" as const,
  baseTime: 0,
  isRunning: false,
  startTime: null,
  pausedAt: null,
};

// Valores por defecto para restaurar al cerrar un juego
export const DEFAULT_ROLES = ["Jugador"];
export const DEFAULT_PLAYER_STATES = ["Envenenado", "Peruano", "De Viator"];
export const DEFAULT_PUBLIC_STATES = ["Vivo", "Muerto", "Carcel"];
export const DEFAULT_GLOBAL_STATES = ["Día", "Noche"];

export const createGameSlice: StateCreator<
  AppStore,
  [],
  [],
  Pick<
    AppStore,
    "room" | "subscribeToRoom" | "updatePlayerStatus" | "voteForGame"
  >
> = (set, get) => ({
  room: {
    status: "waiting",
    gameSelected: null,
    gameStatus: "lobby",
    gamePhase: 0,
    players: [],
    messages: [],
    votes: {},
    globalState: "Día",
    tickerText: "Esperando conexión...",
    clockConfig: DEFAULT_CLOCK_CONFIG,
    tickerSpeed: 20,
    channels: { global: [] },
    globalStates: DEFAULT_GLOBAL_STATES,
    playerStates: DEFAULT_PLAYER_STATES,
    publicStates: DEFAULT_PUBLIC_STATES,
    roles: DEFAULT_ROLES,
    defaultRoles: DEFAULT_ROLES,
    defaultPlayerStates: DEFAULT_PLAYER_STATES,
    defaultPublicStates: DEFAULT_PUBLIC_STATES,
    defaultGlobalStates: DEFAULT_GLOBAL_STATES,
    chatRooms: [],
    notifications: [],
    typing: {},
  },

  subscribeToRoom: () => {
    const state = get();
    if (state.ui.isSync) return;

    const roomRef = ref(db, ROOM_REF);

    onValue(roomRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        // PRIORITY: Detect shutdown status
        if (data.status === "shutdown") {
          sessionStorage.clear();
          set({
            user: { nickname: "", isGM: false, id: null },
            ui: {
              isChatOpen: false,
              isSync: false,
              currentView: "login",
              isLoading: false,
              error: null,
              activeChannel: "global",
            },
          });
          return; // Don't process any more data
        }

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

          return {
            room: {
              ...state.room,
              status: newStatus,
              gameStatus: data.gameStatus || "lobby",
              gamePhase: data.gamePhase || 0,
              tickerText: data.ticker || "Sistema en línea.",
              clockConfig: data.clockConfig || DEFAULT_CLOCK_CONFIG,
              tickerSpeed: data.tickerSpeed || 20,
              globalState: data.globalState || "Esperando",
              players: playersList,
              messages: channelsData.global || [],
              votes: data.votes || {},
              channels: channelsData,
              gameSelected: data.gameSelected || null,
              globalStates: data.globalStates || DEFAULT_GLOBAL_STATES,
              playerStates: data.playerStates || DEFAULT_PLAYER_STATES,
              publicStates: data.publicStates || DEFAULT_PUBLIC_STATES,
              roles: data.roles || DEFAULT_ROLES,
              defaultRoles: data.defaultRoles || DEFAULT_ROLES,
              defaultPlayerStates:
                data.defaultPlayerStates || DEFAULT_PLAYER_STATES,
              defaultPublicStates:
                data.defaultPublicStates || DEFAULT_PUBLIC_STATES,
              defaultGlobalStates:
                data.defaultGlobalStates || DEFAULT_GLOBAL_STATES,
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
});
