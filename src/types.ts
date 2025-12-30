export type ViewName = "login" | "patio" | "gm" | "player";
export type RoomStatus = "waiting" | "playing";

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
}

export interface ChatMessage {
  id: string;
  user: string;
  text: string;
  role: "gm" | "player";
  timestamp: number;
}

export interface RoomState {
  status: RoomStatus;
  gameSelected: string | null;
  players: Player[];
  messages: ChatMessage[];
  votes: Record<string, number>;
  globalState: string;
  tickerText: string;
  gameClock: string;
}

export interface UIState {
  isChatOpen: boolean;
  isSync: boolean;
  currentView: ViewName;
  isLoading: boolean;
  error: string | null;
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

  // Async Firebase Actions
  loginToFirebase: (nickname: string, isGM: boolean) => Promise<void>;
  subscribeToRoom: () => void; // The "Sync" function
  sendChatMessage: (text: string) => Promise<void>;
  updatePlayerStatus: (ready: boolean) => Promise<void>;
  voteForGame: (gameId: string) => Promise<void>;

  // GM Actions
  gmUpdateTicker: (text: string) => void;
  gmUpdateClock: (time: string) => void;
  gmUpdateGlobalState: (state: string) => void;
  gmStartGame: (gameId: string) => Promise<void>;
  gmEndGame: () => Promise<void>;
}
