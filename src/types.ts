import React from "react";

export type ViewName = "login" | "patio" | "gm" | "player";
export type RoomStatus = "waiting" | "playing" | "shutdown";
export type ClockMode = "static" | "countdown" | "stopwatch";
export type ChatChannelType = "global" | "private" | "room";
export type GameStatus = "lobby" | "setup" | "playing";

// ============ GAME ENGINE TYPES ============

export interface GameSpecificData {
  roles: string[]; // Ej: ["Bala", "Vacio"]
  playerStates: string[]; // Ej: ["Envenenado"]
  publicStates: string[]; // Ej: ["Marcado"]
  globalStates: string[]; // Ej: ["Niebla"]
}

export interface GameModule {
  id: string;
  title: string;
  description: string;
  minRoles: string[]; // Roles mínimos requeridos para Fase 0
  specificData: GameSpecificData; // Datos que se suman a los defaults
  Component: React.ComponentType; // La pantalla de juego (Fase 1+)
}

// ============================================

export interface ClockConfig {
  mode: ClockMode;
  baseTime: number; // Tiempo acumulado en segundos
  isRunning: boolean; // Si el reloj está corriendo
  startTime: number | null; // Timestamp de cuando se inició (null si pausado/estático)
  pausedAt: number | null; // Timestamp de cuando se pauso (null si no pausado)
}

export interface UserState {
  nickname: string;
  isGM: boolean;
  id: string | null;
}

export interface Player {
  id: string;
  nickname: string;
  isGM: boolean;
  ready: boolean;
  status: "online" | "offline";
  roles?: string[]; // Múltiples roles
  playerStates?: string[]; // Estados privados (solo GM ve) - múltiples
  publicStates?: string[]; // Estados visibles para todos - múltiples
  lastSeen?: number; // Timestamp de última actividad
}

export interface ChatRoom {
  id: string;
  name: string;
  playerIds: string[];
  createdAt: number;
}

export interface PlayerNotification {
  id: string;
  type: "sound" | "vibration" | "divineVoice" | "globalMessage";
  payload: {
    soundId?: string;
    intensity?: number; // ms for vibration
    message?: string;
  };
  targetPlayerId?: string; // undefined = todos los players
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  user: string;
  text: string;
  role: "gm" | "player";
  timestamp: number;
  channel?: string; // Canal al que pertenece
}

export interface RoomState {
  status: RoomStatus;
  gameSelected: string | null;
  gameStatus: GameStatus; // Estado del juego: lobby, setup, playing
  gamePhase: number; // Fase actual del juego (0 = setup, 1+ = juego)
  players: Player[];
  messages: ChatMessage[];
  votes: Record<string, Record<string, boolean>>;
  globalState: string;
  tickerText: string;
  clockConfig: ClockConfig;
  tickerSpeed: number; // Velocidad en segundos del ciclo
  channels: Record<string, ChatMessage[]>; // { global: [], private_uid: [], room_name: [] }
  // Estados personalizables
  globalStates: string[]; // Estados globales (Día, Noche, etc.)
  playerStates: string[]; // Estados personales (Envenenado, etc.)
  publicStates: string[]; // Estados públicos (Vivo, Muerto, etc.)
  roles: string[]; // Roles disponibles para asignar a jugadores
  // Valores por defecto (para restaurar al cerrar juego)
  defaultRoles: string[];
  defaultPlayerStates: string[];
  defaultPublicStates: string[];
  defaultGlobalStates: string[];
  // Chat rooms y notificaciones
  chatRooms: ChatRoom[];
  notifications: PlayerNotification[];
  // Typing indicators: { channelName: { oderId: timestamp } }
  typing: Record<string, Record<string, number>>;
  // Force refresh timestamp for sync
  forceRefreshTimestamp?: number;
}

export interface UIState {
  isChatOpen: boolean;
  isSync: boolean;
  currentView: ViewName;
  isLoading: boolean;
  error: string | null;
  activeChannel: string; // Canal de chat activo
}

export interface AppStore {
  user: UserState;
  room: RoomState;
  ui: UIState;

  // Actions
  toggleChat: () => void;
  setCurrentView: (view: ViewName) => void;
  setNickname: (nickname: string) => void;
  setGM: (isGM: boolean) => void;
  setActiveChannel: (channel: string) => void;

  // Async Firebase Actions
  restoreAuthSession: () => Promise<void>;
  cleanupOldPlayers: () => Promise<void>;
  loginToFirebase: (nickname: string, isGM: boolean) => Promise<void>;
  subscribeToRoom: () => void;
  sendChatMessage: (text: string, channel?: string) => Promise<void>;
  updatePlayerStatus: (ready: boolean) => Promise<void>;
  voteForGame: (gameId: string) => Promise<void>;

  // GM Actions
  gmUpdateTicker: (text: string) => void;
  gmUpdateGlobalState: (state: string) => void;
  gmStartGame: (gameId: string) => Promise<void>;
  gmEndGame: () => Promise<void>;
  gmSetBaseTime: (seconds: number) => void;
  gmStartClock: (mode: "countdown" | "stopwatch") => void;
  gmPauseClock: () => void;
  gmResetClock: () => void;
  gmSetStaticTime: (timeString: string) => void;
  gmSetTickerSpeed: (speed: number) => void;
  gmKickPlayer: (playerId: string) => Promise<void>;
  gmRemovePlayer: (playerId: string) => Promise<void>;
  gmUpdatePlayerState: (
    playerId: string,
    playerStates: string[],
    publicStates: string[]
  ) => Promise<void>;
  gmWhisper: (playerId: string, text: string) => Promise<void>;
  gmResetRoom: () => Promise<void>;
  gmTogglePlayerRole: (playerId: string, role: string) => Promise<void>;
  gmTurnOffSession: () => Promise<void>;

  // State Management Actions
  gmAddGlobalState: (state: string) => void;
  gmEditGlobalState: (oldState: string, newState: string) => void;
  gmDeleteGlobalState: (state: string) => void;
  gmAddPlayerStateOption: (state: string) => void;
  gmEditPlayerStateOption: (oldState: string, newState: string) => void;
  gmDeletePlayerStateOption: (state: string) => void;
  gmAddPublicStateOption: (state: string) => void;
  gmEditPublicStateOption: (oldState: string, newState: string) => void;
  gmDeletePublicStateOption: (state: string) => void;
  gmTogglePlayerState: (playerId: string, state: string) => Promise<void>;
  gmTogglePublicState: (playerId: string, state: string) => Promise<void>;
  gmSelectGame: (gameId: string | null) => Promise<void>;

  // Role Management Actions
  gmAddRole: (role: string) => void;
  gmEditRole: (oldRole: string, newRole: string) => void;
  gmDeleteRole: (role: string) => void;

  // Game Engine Actions
  prepareGame: (gameModule: GameModule) => Promise<void>;
  setGamePhase: (phase: number) => Promise<void>;
  stopGame: () => Promise<void>;

  // Shutdown & Refresh Actions
  gmShutdown: () => Promise<void>;
  gmForceRefreshAll: () => Promise<void>;

  // Notification Actions
  gmSendGlobalMessage: (text: string) => Promise<void>;
  gmSendSound: (playerId: string | null, soundId: string) => Promise<void>;
  gmSendVibration: (
    playerId: string | null,
    intensity: number
  ) => Promise<void>;
  gmSendDivineVoice: (playerId: string | null, text: string) => Promise<void>;
  clearNotification: (notificationId: string) => Promise<void>;

  // Chat Room Actions
  gmCreateChatRoom: (name: string, playerIds: string[]) => Promise<void>;
  gmAddPlayerToRoom: (roomId: string, playerId: string) => Promise<void>;
  gmRemovePlayerFromRoom: (roomId: string, playerId: string) => Promise<void>;
  gmCloseChatRoom: (roomId: string) => Promise<void>;

  // Typing indicator
  setTyping: (channel: string, isTyping: boolean) => void;
}
