import React from 'react';
import { useTimerStore } from '../store/useTimerStore';
import { User } from 'lucide-react';

const Header: React.FC = () => {
  const { totalSeconds, toggleTimer, isRunning } = useTimerStore();

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-surface/90 backdrop-blur-md border-b border-zinc-800 z-50 shadow-lg">
      <div className="flex flex-col px-4 py-3">
        {/* Top Row: Clock & User Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Clickable Game Clock */}
            <button 
              onClick={toggleTimer}
              className={`font-mono text-4xl font-bold tracking-wider transition-colors duration-200 hover:opacity-80 active:scale-95 ${
                isRunning ? 'text-green-500' : 'text-primary'
              }`}
              aria-label="Toggle Timer"
            >
              {formatTime(totalSeconds)}
            </button>
            
            <div className="flex flex-col ml-2">
              <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">JUEGO EN CURSO</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-full">
            <User size={16} className="text-zinc-400" />
            <span className="text-sm font-medium text-zinc-300">Profesor</span>
          </div>
        </div>

        {/* Bottom Row: Ticker / Info */}
        <div className="mt-2 overflow-hidden relative h-6">
           <div className="animate-marquee whitespace-nowrap text-xs text-zinc-500 font-mono">
             SISTEMA ACTIVO /// ESPERANDO COMANDO /// LA CASA SIN PAPEL /// CONFIGURACIÓN DISPONIBLE ///
           </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
