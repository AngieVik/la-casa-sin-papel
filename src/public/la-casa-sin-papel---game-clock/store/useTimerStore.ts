import { create } from 'zustand';
import { TimerMode, TimerState } from '../types';

export const useTimerStore = create<TimerState>((set, get) => ({
  totalSeconds: 0,
  isRunning: false,
  mode: TimerMode.COUNT_UP,

  setSeconds: (seconds: number) => {
    // Clamp between 0 and 99 minutes 59 seconds (5999 seconds)
    const clamped = Math.max(0, Math.min(seconds, 5999));
    set({ totalSeconds: clamped, isRunning: false });
  },

  toggleTimer: () => {
    const { isRunning, totalSeconds, mode } = get();
    
    // Prevent starting countdown if already at 0
    if (!isRunning && mode === TimerMode.COUNT_DOWN && totalSeconds <= 0) {
      return;
    }
    
    set({ isRunning: !isRunning });
  },

  setMode: (mode: TimerMode) => {
    set({ mode, isRunning: false });
  },

  tick: () => {
    const { mode, totalSeconds, isRunning } = get();
    
    if (!isRunning) return;

    if (mode === TimerMode.COUNT_UP) {
      const next = totalSeconds + 1;
      // Loop back to 0 if it exceeds 99:59 (5999s) -> 6000s
      if (next >= 6000) {
        set({ totalSeconds: 0 }); // Continue running from 0
      } else {
        set({ totalSeconds: next });
      }
    } else {
      // Countdown
      const next = totalSeconds - 1;
      if (next <= 0) {
        set({ totalSeconds: 0, isRunning: false });
      } else {
        set({ totalSeconds: next });
      }
    }
  },

  reset: () => set({ totalSeconds: 0, isRunning: false })
}));
