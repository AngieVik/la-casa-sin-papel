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

import { ROOM_REF } from "../constants/firebase";
import {
  DEFAULT_CLOCK_CONFIG,
  DEFAULT_ROLES,
  DEFAULT_PLAYER_STATES,
  DEFAULT_PUBLIC_STATES,
  DEFAULT_GLOBAL_STATES,
} from "../constants/defaults";

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
          const currentUser = get().user;

          // Si el usuario es GM, permitir quedarse
          if (currentUser.isGM) {
            // El GM puede ver la sala cerrada pero no se desconecta
            // Solo actualizar el estado de la room
          } else {
            // Jugadores normales: desconectar y enviar al login
            sessionStorage.clear();
            set({
              user: { nickname: "", isGM: false, id: null },
              ui: {
                isChatOpen: false,
                isSync: false,
                currentView: "login",
                isLoading: false,
                error: null,
                activeTab: "global",
                unreadTabs: [],
              },
            });
            return; // Don't process any more data for non-GM users
          }
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

          // Detect new messages for granular notifications
          let newUnreadTabs = [...(state.ui.unreadTabs || [])];
          if (state.ui.isSync) {
            Object.keys(channelsData).forEach((channelName) => {
              const currentCount = channelsData[channelName].length;
              const prevCount = state.room.channels[channelName]?.length || 0;

              if (currentCount > prevCount) {
                // Map channel to tab
                let tabName = "";
                if (channelName === "global") tabName = "global";
                else if (channelName.startsWith("private_"))
                  tabName = "privado";
                else if (channelName.startsWith("room_"))
                  tabName = channelName.replace("room_", "");

                if (tabName) {
                  // Notify if: chat is closed OR activeTab is different
                  const isVisible =
                    state.ui.isChatOpen && state.ui.activeTab === tabName;
                  if (!isVisible && !newUnreadTabs.includes(tabName)) {
                    newUnreadTabs.push(tabName);
                  }
                }
              }
            });
          }

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
              unreadTabs: newUnreadTabs,
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
