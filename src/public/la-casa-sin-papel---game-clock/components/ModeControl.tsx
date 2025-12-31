import React from 'react';
import { TimerMode } from '../types';
import { useTimerStore } from '../store/useTimerStore';
import { Play, Pause, ChevronUp, ChevronDown } from 'lucide-react';

const ModeControl: React.FC = () => {
  const { mode, setMode, isRunning, toggleTimer, totalSeconds } = useTimerStore();

  const handleModeSelect = (selectedMode: TimerMode) => {
    setMode(selectedMode);
  };

  const getCardStyle = (cardMode: TimerMode) => {
    const isActive = mode === cardMode;
    return `relative flex flex-col p-5 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
      isActive 
        ? 'bg-zinc-800 border-primary shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
        : 'bg-surface border-zinc-800 opacity-60 hover:opacity-100 hover:border-zinc-700'
    }`;
  };

  return (
    <div className="grid grid-cols-2 gap-4 w-full max-w-sm mx-auto mt-6">
      
      {/* Count Up Card */}
      <div 
        className={getCardStyle(TimerMode.COUNT_UP)}
        onClick={() => handleModeSelect(TimerMode.COUNT_UP)}
      >
        <div className="flex items-center justify-between mb-4">
          <ChevronUp className={`w-6 h-6 ${mode === TimerMode.COUNT_UP ? 'text-primary' : 'text-zinc-500'}`} />
          <span className="text-xs font-bold text-zinc-500 uppercase">Progresiva</span>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Cronómetro</h3>
        
        {mode === TimerMode.COUNT_UP && (
          <div className="mt-auto pt-2">
             <ActionButtons isRunning={isRunning} toggle={toggleTimer} />
          </div>
        )}
      </div>

      {/* Count Down Card */}
      <div 
        className={getCardStyle(TimerMode.COUNT_DOWN)}
        onClick={() => handleModeSelect(TimerMode.COUNT_DOWN)}
      >
        <div className="flex items-center justify-between mb-4">
          <ChevronDown className={`w-6 h-6 ${mode === TimerMode.COUNT_DOWN ? 'text-primary' : 'text-zinc-500'}`} />
          <span className="text-xs font-bold text-zinc-500 uppercase">Regresiva</span>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Cuenta Atrás</h3>
        
        {mode === TimerMode.COUNT_DOWN && (
          <div className="mt-auto pt-2">
             {/* Disable play if time is 0 for countdown */}
             <ActionButtons 
               isRunning={isRunning} 
               toggle={toggleTimer} 
               disabled={totalSeconds <= 0} 
             />
          </div>
        )}
      </div>
    </div>
  );
};

const ActionButtons: React.FC<{ isRunning: boolean; toggle: () => void; disabled?: boolean }> = ({ 
  isRunning, 
  toggle,
  disabled = false
}) => (
  <button 
    onClick={(e) => {
      e.stopPropagation();
      if (!disabled) toggle();
    }}
    disabled={disabled}
    className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 font-bold text-sm transition-colors ${
      disabled 
        ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
        : isRunning 
          ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
          : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
    }`}
  >
    {isRunning ? <Pause size={16} /> : <Play size={16} />}
    {isRunning ? 'PAUSAR' : 'INICIAR'}
  </button>
);

export default ModeControl;
