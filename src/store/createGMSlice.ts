import { StateCreator } from "zustand";
import { AppStore, GameModule } from "../types";
import { db } from "../firebaseConfig";
import {
  ref,
  update,
  push,
  remove,
  set as firebaseSet,
} from "firebase/database";
import { ROOM_REF } from "../constants/firebase";
import {
  DEFAULT_CLOCK_CONFIG,
  DEFAULT_ROLES,
  DEFAULT_PLAYER_STATES,
  DEFAULT_PUBLIC_STATES,
  DEFAULT_GLOBAL_STATES,
} from "../constants/defaults";

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
    | "gmTogglePlayerRole"
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
    | "gmTurnOffSession"
    | "gmOpenRoom"
    | "prepareGame"
    | "setGamePhase"
    | "stopGame"
    | "gmShutdown"
    | "gmForceRefreshAll"
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
      // Mantenemos los canales (historial de chat) activos en el lobby
    };

    // 1. Filtrado de Votos (Sanitization)
    if (room.votes) {
      Object.entries(room.votes).forEach(([gameId, gameVotes]) => {
        Object.keys(gameVotes).forEach((voterId) => {
          const player = room.players.find((p) => p.id === voterId);
          // Si no existe o está offline -> Voto Fantasma
          if (!player || player.status === "offline") {
            updates[`votes/${gameId}/${voterId}`] = null;
          }
        });
      });
    }

    // 2. Limpieza de Jugadores (Reset de estado de juego, mantener conexión)
    room.players.forEach((p) => {
      if (p.status === "offline") {
        updates[`players/${p.id}/roles`] = null;
        updates[`players/${p.id}/playerStates`] = null;
        updates[`players/${p.id}/publicStates`] = null;
        updates[`players/${p.id}/ready`] = false;
      } else {
        // Online: mantenles sus datos básicos pero pon ready: false
        updates[`players/${p.id}/ready`] = false;
      }
    });

    await update(ref(db, ROOM_REF), updates);
  },

  gmTurnOffSession: async () => {
    // Objetivo: cerrar la sala, expulsar a todos los jugadores (excepto GM) y poner status shutdown
    const { room, user } = get();
    const updates: Record<string, unknown> = {
      status: "shutdown",
      globalState: "Sala Cerrada",
      votes: null,
      channels: null,
      chatRooms: null,
      notifications: null,
      gameSelected: null,
      gameStatus: "lobby",
      gamePhase: 0,
      clockConfig: {
        ...DEFAULT_CLOCK_CONFIG,
        mode: "static",
        baseTime: 0,
        isRunning: false,
      },
      ticker: "Sala cerrada por el GM.",
    };

    // Eliminar todos los jugadores EXCEPTO el GM actual
    room.players.forEach((player) => {
      if (player.id !== user.id) {
        updates[`players/${player.id}`] = null;
      }
    });

    await update(ref(db, ROOM_REF), updates);
  },

  gmOpenRoom: async () => {
    // Encender la sala desde shutdown
    await update(ref(db, ROOM_REF), {
      status: "waiting",
      globalState: "Sala Abierta",
      ticker: "Bienvenidos. La sala está abierta.",
    });
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
    // Soft Reset: Reinicia el juego pero mantiene a los jugadores conectados y las configuraciones.
    const initialRoomState = {
      status: "waiting",
      channels: null, // Limpia chat
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
      players: {},
    };

    const { room } = get();

    // Reconstruir objeto de jugadores (solo datos de conexión)
    const resetPlayers: Record<string, any> = {};
    room.players.forEach((p) => {
      resetPlayers[p.id] = {
        ...p,
        ready: false,
        playerStates: [],
        publicStates: [],
        roles: ["Jugador"], // Reset a rol por defecto
      };
    });

    const stateToSet = {
      ...initialRoomState,
      players: resetPlayers,
      // Mantenemos las listas de opciones actuales (roles, estados)
      roles: room.roles,
      globalStates: room.globalStates,
      playerStates: room.playerStates,
      publicStates: room.publicStates,
    };

    await firebaseSet(ref(db, ROOM_REF), stateToSet);
  },

  gmTogglePlayerRole: async (playerId: string, role: string) => {
    const { room } = get();
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    const currentRoles = player.roles || [];
    let newRoles: string[];

    if (currentRoles.includes(role)) {
      newRoles = currentRoles.filter((r) => r !== role);
    } else {
      newRoles = [...currentRoles, role];
    }

    const playerRef = ref(db, `${ROOM_REF}/players/${playerId}`);
    await update(playerRef, { roles: newRoles });
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

    // Actualizar también a los jugadores que tengan este rol
    room.players.forEach((player) => {
      if (player.roles?.includes(oldRole)) {
        const newPlayerRoles = player.roles.map((r) =>
          r === oldRole ? newRole : r
        );
        update(ref(db, `${ROOM_REF}/players/${player.id}`), {
          roles: newPlayerRoles,
        });
      }
    });
  },

  gmDeleteRole: (role: string) => {
    const { room } = get();
    const newRoles = room.roles.filter((r) => r !== role);
    update(ref(db, ROOM_REF), { roles: newRoles });

    // Quitar el rol a los jugadores que lo tengan
    room.players.forEach((player) => {
      if (player.roles?.includes(role)) {
        const newPlayerRoles = player.roles.filter((r) => r !== role);
        update(ref(db, `${ROOM_REF}/players/${player.id}`), {
          roles: newPlayerRoles,
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
    // Borrar mensajes asociados al canal de esa sala
    const channelRef = ref(db, `${ROOM_REF}/channels/room_${roomId}`);
    await remove(channelRef);
  },

  // ============ GAME ENGINE ACTIONS ============

  prepareGame: async (gameModule: GameModule) => {
    const { room } = get();

    // IMPORTANTE: Si ya hay un juego corriendo, se debería limpiar primero para evitar corrupción de roles.
    // Usamos los defaults almacenados o las constantes como base.
    const baseRoles =
      room.gameStatus === "lobby"
        ? room.roles
        : room.defaultRoles || DEFAULT_ROLES;
    const basePlayerStates =
      room.gameStatus === "lobby"
        ? room.playerStates
        : room.defaultPlayerStates || DEFAULT_PLAYER_STATES;
    const basePublicStates =
      room.gameStatus === "lobby"
        ? room.publicStates
        : room.defaultPublicStates || DEFAULT_PUBLIC_STATES;
    const baseGlobalStates =
      room.gameStatus === "lobby"
        ? room.globalStates
        : room.defaultGlobalStates || DEFAULT_GLOBAL_STATES;

    // Merge específicos del juego
    const mergedRoles = [
      ...new Set([...baseRoles, ...gameModule.specificData.roles]),
    ];
    const mergedPlayerStates = [
      ...new Set([
        ...basePlayerStates,
        ...gameModule.specificData.playerStates,
      ]),
    ];
    const mergedPublicStates = [
      ...new Set([
        ...basePublicStates,
        ...gameModule.specificData.publicStates,
      ]),
    ];
    const mergedGlobalStates = [
      ...new Set([
        ...baseGlobalStates,
        ...gameModule.specificData.globalStates,
      ]),
    ];

    // Actualizar Firebase con el nuevo estado
    await update(ref(db, ROOM_REF), {
      status: "playing",
      gameStatus: "setup",
      gameSelected: gameModule.id,
      gamePhase: 0,
      roles: mergedRoles,
      playerStates: mergedPlayerStates,
      publicStates: mergedPublicStates,
      globalStates: mergedGlobalStates,
      // Guardar los defaults (si no existían ya) para poder restaurar al cerrar
      defaultRoles: room.defaultRoles || DEFAULT_ROLES,
      defaultPlayerStates: room.defaultPlayerStates || DEFAULT_PLAYER_STATES,
      defaultPublicStates: room.defaultPublicStates || DEFAULT_PUBLIC_STATES,
      defaultGlobalStates: room.defaultGlobalStates || DEFAULT_GLOBAL_STATES,
    });
  },

  setGamePhase: async (phase: number) => {
    const updates: Record<string, unknown> = { gamePhase: phase };

    // Si avanzamos a fase 1+, el gameStatus pasa a "playing"
    if (phase >= 1) {
      updates.gameStatus = "playing";

      // Lógica Automática de Global States para Hombres Lobo
      // Fase 1: Día
      // Fase 2: Noche
      // Fase 3: Día ...
      if (phase % 2 !== 0) {
        updates.globalState = "Día";
      } else {
        updates.globalState = "Noche";
      }
    } else {
      updates.gameStatus = "setup";
      // Opcional: Resetear a un estado default en setup
      // updates.globalState = "Fase 0";
    }

    await update(ref(db, ROOM_REF), updates);
  },

  stopGame: async () => {
    const { room } = get();

    // Identificar roles/estados exclusivos del juego para limpiarlos de los jugadores
    const gameRoles = room.roles.filter((r) => !room.defaultRoles.includes(r));
    const gamePlayerStates = room.playerStates.filter(
      (s) => !room.defaultPlayerStates.includes(s)
    );
    const gamePublicStates = room.publicStates.filter(
      (s) => !room.defaultPublicStates.includes(s)
    );

    const updates: Record<string, unknown> = {
      status: "waiting",
      gameStatus: "lobby",
      gameSelected: null,
      gamePhase: 0,
      // Restaurar a valores por defecto (guardados en prepareGame)
      roles: room.defaultRoles,
      playerStates: room.defaultPlayerStates,
      publicStates: room.defaultPublicStates,
      globalStates: room.defaultGlobalStates,
    };

    // Sanitización de jugadores: eliminar roles/estados del juego cerrado
    room.players.forEach((player) => {
      const currentRoles = player.roles || [];
      const currentPlayerStates = player.playerStates || [];
      const currentPublicStates = player.publicStates || [];

      // Filtrar roles del juego
      const cleanedRoles = currentRoles.filter((r) => !gameRoles.includes(r));
      const cleanedPlayerStates = currentPlayerStates.filter(
        (s) => !gamePlayerStates.includes(s)
      );
      const cleanedPublicStates = currentPublicStates.filter(
        (s) => !gamePublicStates.includes(s)
      );

      updates[`players/${player.id}/roles`] =
        cleanedRoles.length > 0 ? cleanedRoles : null;
      updates[`players/${player.id}/playerStates`] =
        cleanedPlayerStates.length > 0 ? cleanedPlayerStates : null;
      updates[`players/${player.id}/publicStates`] =
        cleanedPublicStates.length > 0 ? cleanedPublicStates : null;
      updates[`players/${player.id}/ready`] = false;
    });

    await update(ref(db, ROOM_REF), updates);
  },

  // ============ SHUTDOWN & REFRESH ACTIONS ============

  gmShutdown: async () => {
    // Apagado total: limpia todo (Factory Reset)
    await update(ref(db, ROOM_REF), {
      status: "shutdown",
      players: null,
      votes: null,
      channels: { global: null },
      chatRooms: null,
      notifications: null,
      gameSelected: null,
      gameStatus: "lobby",
      gamePhase: 0,
      roles: DEFAULT_ROLES,
      playerStates: DEFAULT_PLAYER_STATES,
      publicStates: DEFAULT_PUBLIC_STATES,
      globalStates: DEFAULT_GLOBAL_STATES,
      defaultRoles: DEFAULT_ROLES,
      defaultPlayerStates: DEFAULT_PLAYER_STATES,
      defaultPublicStates: DEFAULT_PUBLIC_STATES,
      defaultGlobalStates: DEFAULT_GLOBAL_STATES,
      ticker: "Sistema apagado.",
      globalState: "Día",
      forceRefreshTimestamp: null,
    });
  },

  gmForceRefreshAll: async () => {
    // Forzar resincronización de todos los clientes + limpiar jugadores offline
    const { room } = get();
    const updates: Record<string, unknown> = {
      forceRefreshTimestamp: Date.now(),
    };

    // Eliminar jugadores offline de Firebase
    room.players.forEach((player) => {
      if (!player.isGM && player.status === "offline") {
        updates[`players/${player.id}`] = null;
      }
    });

    await update(ref(db, ROOM_REF), updates);
  },
});
