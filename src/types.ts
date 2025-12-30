export type ViewName = "login" | "patio" | "gm" | "player";
export type RoomStatus = "waiting" | "playing";
export type ClockMode = "static" | "countdown" | "stopwatch";
export type ChatChannelType = "global" | "private" | "room";

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
  role?: string;
  playerState?: string; // Estado privado (solo GM ve)
  publicState?: string; // Estado visible para todos
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
  players: Player[];
  messages: ChatMessage[];
  votes: Record<string, Record<string, boolean>>;
  globalState: string;
  tickerText: string;
  gameClock: string;
  clockMode: ClockMode;
  tickerSpeed: number; // Velocidad en segundos del ciclo
  channels: Record<string, ChatMessage[]>; // { global: [], private_uid: [], room_name: [] }
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
  loginToFirebase: (nickname: string, isGM: boolean) => Promise<void>;
  subscribeToRoom: () => void;
  sendChatMessage: (text: string, channel?: string) => Promise<void>;
  updatePlayerStatus: (ready: boolean) => Promise<void>;
  voteForGame: (gameId: string) => Promise<void>;

  // GM Actions
  gmUpdateTicker: (text: string) => void;
  gmUpdateClock: (time: string) => void;
  gmUpdateGlobalState: (state: string) => void;
  gmStartGame: (gameId: string) => Promise<void>;
  gmEndGame: () => Promise<void>;
  gmSetClockMode: (mode: ClockMode) => void;
  gmSetTickerSpeed: (speed: number) => void;
  gmKickPlayer: (playerId: string) => Promise<void>;
  gmRemovePlayer: (playerId: string) => Promise<void>;
  gmUpdatePlayerState: (
    playerId: string,
    playerState: string,
    publicState: string
  ) => Promise<void>;
  gmWhisper: (playerId: string, text: string) => Promise<void>;
  gmResetRoom: () => Promise<void>;
}
