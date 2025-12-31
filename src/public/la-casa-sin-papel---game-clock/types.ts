export enum TimerMode {
  COUNT_UP = 'COUNT_UP',
  COUNT_DOWN = 'COUNT_DOWN'
}

export interface TimerState {
  totalSeconds: number;
  isRunning: boolean;
  mode: TimerMode;
  setSeconds: (seconds: number) => void;
  toggleTimer: () => void;
  setMode: (mode: TimerMode) => void;
  tick: () => void;
  reset: () => void;
}
