import React from 'react';
import { Moon, Eye, User, HeartPulse, Fingerprint } from 'lucide-react';
import { useStore } from '../store';

const UIPlayer: React.FC = () => {
  const nickname = useStore((state) => state.user.nickname);

  // Mock Data for UI visualization
  const globalStatus = { phase: 'Noche 2', effect: 'Silencio Total' };
  const myRole = { name: 'Infiltrado', team: 'Resistencia', description: 'Puedes ver las votaciones ocultas.' };
  
  const otherPlayers = [
    { id: 1, name: 'Helsinki', status: 'Vivo', isPublic: true },
    { id: 2, name: 'Nairobi', status: 'Herido', isPublic: true },
    { id: 3, name: 'Denver', status: 'Muerto', isPublic: true },
    { id: 4, name: 'Rio', status: 'Vivo', isPublic: true },
    { id: 5, name: 'Palermo', status: 'Vivo', isPublic: true },
  ];

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* 1. Central Card: Global State & Role */}
      <section className="relative overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-900 shadow-2xl">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-green-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 grid grid-cols-1 divide-y divide-neutral-800">
            
            {/* Global State Header */}
            <div className="p-6 text-center bg-neutral-950/50">
                <div className="inline-flex items-center justify-center p-3 bg-neutral-800 rounded-full mb-3 border border-neutral-700">
                    <Moon size={24} className="text-indigo-400" />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">{globalStatus.phase}</h2>
                <p className="text-indigo-400 text-sm font-mono tracking-widest mt-1 uppercase">{globalStatus.effect}</p>
            </div>

            {/* My Role Section */}
            <div className="p-6 bg-gradient-to-b from-neutral-900 to-neutral-900/80">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Tu Identidad</span>
                    <Fingerprint size={16} className="text-green-500" />
                </div>
                
                <div className="mb-4">
                    <h1 className="text-3xl font-black text-green-500 uppercase tracking-tighter">{myRole.name}</h1>
                    <span className="text-xs bg-green-900/20 text-green-400 px-2 py-1 rounded border border-green-900/50 uppercase font-bold tracking-wide">
                        {myRole.team}
                    </span>
                </div>
                
                <p className="text-neutral-300 text-sm leading-relaxed border-l-2 border-green-500/30 pl-3">
                    {myRole.description}
                </p>
            </div>
        </div>
      </section>

      {/* 2. Other Players List */}
      <section>
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4 px-1 flex items-center gap-2">
            <Eye size={14} /> Estado Público de Agentes
        </h3>
        
        <div className="grid gap-2">
            {otherPlayers.map((player) => (
                <div 
                    key={player.id} 
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all
                        ${player.status === 'Muerto' 
                            ? 'bg-neutral-950 border-neutral-900 opacity-60' 
                            : 'bg-neutral-800 border-neutral-700'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full border ${
                            player.status === 'Muerto' ? 'bg-neutral-900 border-neutral-800 text-neutral-600' : 'bg-neutral-700 border-neutral-600 text-neutral-300'
                        }`}>
                            <User size={16} />
                        </div>
                        <div>
                            <span className={`font-bold block ${player.status === 'Muerto' ? 'text-neutral-500 line-through' : 'text-neutral-200'}`}>
                                {player.name}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                         {player.status === 'Vivo' && (
                             <span className="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                         )}
                         {player.status === 'Herido' && (
                             <span className="flex h-2 w-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)] animate-pulse"></span>
                         )}
                         {player.status === 'Muerto' && (
                             <HeartPulse size={16} className="text-neutral-600" />
                         )}
                         <span className="text-xs font-mono text-neutral-500 uppercase w-16 text-right">
                             {player.status}
                         </span>
                    </div>
                </div>
            ))}
        </div>
      </section>

    </div>
  );
};

export default UIPlayer;