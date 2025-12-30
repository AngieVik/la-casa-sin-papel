import React, { useState } from 'react';
import { useStore } from '../store';
import { CheckCircle2, XCircle, Users, Trophy, User, Circle } from 'lucide-react';

const MOCK_GAMES = [
  { id: 'g1', title: 'Atraco a la Fábrica', votes: 12, type: 'Asalto' },
  { id: 'g2', title: 'Plan Chernobyl', votes: 8, type: 'Sigilo' },
  { id: 'g3', title: 'Protocolo Valencia', votes: 5, type: 'Caos' },
  { id: 'g4', title: 'La Casa de Toledo', votes: 4, type: 'Estrategia' },
  { id: 'g5', title: 'Fuga del Banco', votes: 2, type: 'Escape' },
  { id: 'g6', title: 'Código Rojo', votes: 1, type: 'Supervivencia' },
];

const MOCK_PLAYERS = [
  { id: 1, name: 'Helsinki', ready: true },
  { id: 2, name: 'Nairobi', ready: true },
  { id: 3, name: 'Denver', ready: false },
  { id: 4, name: 'Rio', ready: true },
];

const PatioView: React.FC = () => {
  const nickname = useStore((state) => state.user.nickname);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight uppercase">Sala de Planificación</h2>
          <p className="text-neutral-400 text-sm font-mono">Elije el objetivo y confirma tu estado.</p>
        </div>
        <div className="bg-neutral-800 px-3 py-1 rounded-full border border-neutral-700 flex items-center gap-2">
            <Users size={14} className="text-green-500" />
            <span className="text-xs font-bold text-white">5/8 Operativos</span>
        </div>
      </div>

      {/* Game Selection Grid */}
      <section>
        <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Trophy size={16} /> Objetivos Disponibles
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {MOCK_GAMES.map((game) => {
                const isSelected = selectedGame === game.id;
                return (
                    <button
                        key={game.id}
                        onClick={() => setSelectedGame(game.id)}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 group
                            ${isSelected 
                                ? 'bg-neutral-800 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]' 
                                : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-600 hover:bg-neutral-800'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-xs font-mono px-2 py-0.5 rounded border 
                                ${isSelected 
                                    ? 'bg-green-900/30 border-green-500/30 text-green-400' 
                                    : 'bg-neutral-800 border-neutral-700 text-neutral-500'
                                }`}>
                                {game.type}
                            </span>
                            {isSelected && <CheckCircle2 size={16} className="text-green-500" />}
                        </div>
                        <h4 className={`font-bold text-sm mb-1 ${isSelected ? 'text-white' : 'text-neutral-300'}`}>
                            {game.title}
                        </h4>
                        <div className="text-xs text-neutral-500 font-mono">
                            {game.votes} Votos
                        </div>
                    </button>
                );
            })}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Player Status Switch */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-2">Tu Estado</h3>
            <button
                onClick={() => setIsReady(!isReady)}
                className={`w-full py-6 rounded-2xl border-2 flex items-center justify-center gap-4 transition-all duration-300 transform active:scale-95 shadow-lg
                    ${isReady
                        ? 'bg-green-600 border-green-400 text-white shadow-green-900/20'
                        : 'bg-neutral-900 border-red-900/50 text-red-500 hover:bg-red-950/10'
                    }`}
            >
                {isReady ? (
                    <>
                        <CheckCircle2 size={32} />
                        <span className="text-2xl font-black tracking-widest uppercase">Listo</span>
                    </>
                ) : (
                    <>
                        <XCircle size={32} />
                        <span className="text-2xl font-black tracking-widest uppercase">No Listo</span>
                    </>
                )}
            </button>
            <p className="text-center text-xs text-neutral-500 font-mono">
                {isReady ? 'Esperando confirmación del Director...' : 'Marca cuando hayas revisado tu equipo.'}
            </p>
          </section>

          {/* Player List */}
          <section className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
             <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Users size={16} /> Pelotón
            </h3>
            <div className="space-y-2">
                {/* Current User */}
                <div className="flex items-center justify-between p-3 bg-neutral-800/80 rounded-lg border border-neutral-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-neutral-700 rounded-full text-neutral-300">
                            <User size={16} />
                        </div>
                        <span className="font-bold text-white">{nickname} (Tú)</span>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${isReady ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-red-500'}`} />
                </div>

                {/* Other Players */}
                {MOCK_PLAYERS.map((player) => (
                    <div key={player.id} className="flex items-center justify-between p-3 rounded-lg border border-transparent hover:bg-neutral-800/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-neutral-800 rounded-full text-neutral-500">
                                <User size={16} />
                            </div>
                            <span className="font-medium text-neutral-300">{player.name}</span>
                        </div>
                         {player.ready ? (
                             <Circle size={10} className="fill-green-600 text-green-600" />
                         ) : (
                             <Circle size={10} className="fill-red-900 text-red-900" />
                         )}
                    </div>
                ))}
            </div>
          </section>

      </div>
    </div>
  );
};

export default PatioView;