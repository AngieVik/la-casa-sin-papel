export type ViewName = 'login' | 'patio' | 'gm' | 'player';

export interface UserState {
  nickname: string;
  isGM: boolean;
  id: string | null;
}

export interface RoomState {
  gameSelected: string | null;
  players: any[]; // Defined generically for now
  globalState: any[];
  tickerText: string;
  gameClock: string;
}

export interface UIState {
  isChatOpen: boolean;
  isSync: boolean;
  currentView: ViewName;
}

export interface AppStore {
  user: UserState;
  room: RoomState;
  ui: UIState;
  
  // Actions
  setNickname: (nickname: string) => void;
  setGM: (isGM: boolean) => void;
  toggleChat: () => void;
  setTickerText: (text: string) => void;
  updateClock: (time: string) => void;
  setCurrentView: (view: ViewName) => void;
}