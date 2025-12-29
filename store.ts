import { create } from 'zustand';
import { AppStore } from './types';

export const useStore = create<AppStore>((set) => ({
  user: {
    nickname: '',
    isGM: false,
    id: null,
  },
  room: {
    gameSelected: null,
    players: [],
    globalState: [],
    tickerText: 'Bienvenido a la partida... Identifícate para continuar.',
    gameClock: '00:00',
  },
  ui: {
    isChatOpen: false,
    isSync: false,
    currentView: 'login',
  },

  // Actions
  setNickname: (nickname) => 
    set((state) => ({ user: { ...state.user, nickname } })),

  setGM: (isGM) =>
    set((state) => ({ user: { ...state.user, isGM } })),
    
  toggleChat: () => 
    set((state) => ({ ui: { ...state.ui, isChatOpen: !state.ui.isChatOpen } })),

  setTickerText: (text) =>
    set((state) => ({ room: { ...state.room, tickerText: text } })),

  updateClock: (time) =>
    set((state) => ({ room: { ...state.room, gameClock: time } })),

  setCurrentView: (view) =>
    set((state) => ({ ui: { ...state.ui, currentView: view } })),
}));