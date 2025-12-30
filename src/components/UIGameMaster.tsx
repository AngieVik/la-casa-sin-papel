import React, { useState } from 'react';
import { useStore } from '../store';
import { 
  Users, BookOpen, Zap, Settings, Power, 
  Mic, Volume2, MessageSquare, Edit2, Ban, 
  CheckCircle2, XCircle, Clock, Type, Globe 
} from 'lucide-react';

// Mock Data for Players Tab
const MOCK_PLAYERS = [
  { id: 1, name: 'Helsinki', status: 'ready', role: 'Soldado' },
  { id: 2, name: 'Nairobi', status: 'ready', role: 'Falsificadora' },
  { id: 3, name: 'Denver', status: 'pending', role: 'Luchador' },
  { id: 4, name: 'Rio', status: 'ready', role: 'Hacker' },
  { id: 5, name: 'Palermo', status: 'pending', role: 'Líder' },
  { id: 6, name: 'Bogotá', status: 'ready', role: 'Soldador' },
];

type TabID = 'control' | 'narrative' | 'actions';

const UIGameMaster: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabID>('control');
  
  // Store actions
  const tickerText = useStore((state) => state.room.tickerText);
  const gmUpdateTicker = useStore((state) => state.gmUpdateTicker);
  const gameClock = useStore((state) => state.room.gameClock);
  const gmUpdateClock = useStore((state) => state.gmUpdateClock);
  const setCurrentView = useStore((state) => state.setCurrentView);
  const setNickname = useStore((state) => state.setNickname);
  const setGM = useStore((state) => state.setGM);

  // Local state for inputs
  const [localTicker, setLocalTicker] = useState(tickerText);
  const [globalState, setGlobalState] = useState('Día 1: Planificación');

  const handleEndGame = () => {
    if (confirm('¿ESTÁS SEGURO? Esto finalizará la sesión actual.')) {
      setNickname('');
      setGM(false);
      setCurrentView('login');
      // Ticker reset intentionally omitted to avoid global change on local logout
    }
  };

  const handleTickerUpdate = () => {
    gmUpdateTicker(localTicker);
  };

  return (
    <div className="max-w-5xl mx-auto pb-24 animate-in fade-in duration-500">
      
      {/* --- GM Header / Tabs --- */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
            <Settings className="text-red-500 animate-spin-slow" /> 
            Panel de Control
          </h2>
          <p className="text-neutral-500 text-xs font-mono tracking-widest uppercase">Modo Director Activado</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-neutral-900 p-1 rounded-xl border border-neutral-800">
          <button
            onClick={() => setActiveTab('control')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'control' 
                ? 'bg-neutral-800 text-white shadow-md' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Users size={16} /> <span className="hidden md:inline">Operativos</span>
          </button>
          <button
            onClick={() => setActiveTab('narrative')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'narrative' 
                ? 'bg-neutral-800 text-white shadow-md' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <BookOpen size={16} /> <span className="hidden md:inline">Narrativa</span>
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'actions' 
                ? 'bg-neutral-800 text-white shadow-md' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Zap size={16} /> <span className="hidden md:inline">Acciones</span>
          </button>
        </div>

        <button 
          onClick={handleEndGame}
          className="bg-red-950/30 hover:bg-red-900/50 text-red-500 border border-red-900/50 p-2 rounded-lg transition-colors"
          title="Finalizar Juego"
        >
          <Power size={20} />
        </button>
      </div>

      {/* --- Tab Content --- */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 min-h-[500px] shadow-2xl relative overflow-hidden">
        
        {/* TAB: CONTROL (Players) */}
        {activeTab === 'control' && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Gestión de Jugadores ({MOCK_PLAYERS.length})</h3>
               <button className="text-xs bg-neutral-800 text-neutral-300 px-3 py-1 rounded border border-neutral-700 hover:border-green-500 transition-colors">
                 Forzar Sincronización
               </button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
               {MOCK_PLAYERS.map(player => (
                 <div key={player.id} className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl flex items-center justify-between group hover:border-neutral-600 transition-colors">
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white text-lg">{player.name}</span>
                        {player.status === 'ready' 
                          ? <CheckCircle2 size={14} className="text-green-500" /> 
                          : <Clock size={14} className="text-yellow-500" />
                        }
                     </div>
                     <div className="text-xs text-neutral-500 font-mono">{player.role}</div>
                   </div>
                   
                   <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                     <button className="p-2 bg-neutral-800 rounded hover:text-blue-400 text-neutral-400 transition-colors" title="Editar">
                        <Edit2 size={16} />
                     </button>
                     <button className="p-2 bg-neutral-800 rounded hover:bg-red-900/30 hover:text-red-500 text-neutral-400 transition-colors" title="Expulsar">
                        <Ban size={16} />
                     </button>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* TAB: NARRATIVA */}
        {activeTab === 'narrative' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-right-4 duration-300">
            
            {/* Ticker Control */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                <Type size={16} /> Mensaje del Ticker (Marquesina)
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={localTicker}
                  onChange={(e) => setLocalTicker(e.target.value)}
                  className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-yellow-500 focus:outline-none transition-colors"
                />
                <button 
                  onClick={handleTickerUpdate}
                  className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold px-4 py-2 rounded-xl transition-colors"
                >
                  Publicar
                </button>
              </div>
              <p className="text-xs text-neutral-600">Este mensaje aparecerá en la parte superior de todas las pantallas.</p>
            </div>

            {/* Game Clock */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                <Clock size={16} /> Hora del Juego
              </label>
              <div className="flex items-center gap-4 bg-neutral-950 p-4 rounded-xl border border-neutral-800 w-fit">
                <button 
                  onClick={() => gmUpdateClock('00:00')}
                  className="text-xs text-neutral-500 hover:text-white px-2 py-1 bg-neutral-900 rounded border border-neutral-800"
                >
                  Reset
                </button>
                <input 
                  type="time" 
                  value={gameClock}
                  onChange={(e) => gmUpdateClock(e.target.value)}
                  className="bg-transparent text-3xl font-mono font-bold text-green-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Global State */}
            <div className="space-y-4 md:col-span-2">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                <Globe size={16} /> Estado Global (Fase)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                 {['Día 1', 'Noche 1', 'Día 2', 'Noche 2', 'Alerta Roja', 'Victoria', 'Derrota'].map((state) => (
                   <button
                    key={state}
                    onClick={() => setGlobalState(state)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all
                      ${globalState === state 
                        ? 'bg-green-600 border-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]' 
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-600'
                      }`}
                   >
                     {state}
                   </button>
                 ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB: ACCIONES */}
        {activeTab === 'actions' && (
          <div className="animate-in slide-in-from-right-4 duration-300">
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
               
               <button className="aspect-square bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-4 group hover:bg-neutral-800 hover:border-indigo-500 transition-all">
                  <div className="p-4 bg-indigo-500/10 rounded-full group-hover:bg-indigo-500 text-indigo-500 group-hover:text-white transition-colors">
                    <MessageSquare size={32} />
                  </div>
                  <span className="font-bold text-neutral-300 group-hover:text-white">Mensaje Secreto</span>
               </button>

               <button className="aspect-square bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-4 group hover:bg-neutral-800 hover:border-pink-500 transition-all">
                  <div className="p-4 bg-pink-500/10 rounded-full group-hover:bg-pink-500 text-pink-500 group-hover:text-white transition-colors">
                    <Volume2 size={32} />
                  </div>
                  <span className="font-bold text-neutral-300 group-hover:text-white">Efecto Sonido</span>
               </button>

               <button className="aspect-square bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-4 group hover:bg-neutral-800 hover:border-orange-500 transition-all">
                  <div className="p-4 bg-orange-500/10 rounded-full group-hover:bg-orange-500 text-orange-500 group-hover:text-white transition-colors">
                    <Zap size={32} />
                  </div>
                  <span className="font-bold text-neutral-300 group-hover:text-white">Vibración</span>
               </button>

               <button className="aspect-square bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-4 group hover:bg-neutral-800 hover:border-blue-500 transition-all">
                  <div className="p-4 bg-blue-500/10 rounded-full group-hover:bg-blue-500 text-blue-500 group-hover:text-white transition-colors">
                    <Mic size={32} />
                  </div>
                  <span className="font-bold text-neutral-300 group-hover:text-white">Voz Divina</span>
               </button>

             </div>

             <div className="mt-8 p-4 bg-red-950/20 border border-red-900/30 rounded-xl">
                <h4 className="text-red-500 font-bold mb-2 flex items-center gap-2">
                  <Settings size={16} /> Zona de Peligro
                </h4>
                <div className="flex gap-4">
                  <button className="px-4 py-2 bg-red-900/20 text-red-400 border border-red-900/50 rounded-lg hover:bg-red-900 hover:text-white text-sm transition-colors">
                    Reiniciar Ronda
                  </button>
                  <button className="px-4 py-2 bg-red-900/20 text-red-400 border border-red-900/50 rounded-lg hover:bg-red-900 hover:text-white text-sm transition-colors">
                    Eliminar Todos
                  </button>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default UIGameMaster;