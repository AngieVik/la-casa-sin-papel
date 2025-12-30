import React from "react";
import { useStore } from "../store";
import { Users, CheckCircle, XCircle, BookOpen, ThumbsUp } from "lucide-react";

const JUEGOS = [
  { id: "juego1", title: "Atraco al Banco", desc: "Gestión de recursos y tiempo." },
  { id: "juego2", title: "El Topo", desc: "Roles ocultos y deducción." },
  { id: "juego3", title: "Protocolo Fantasma", desc: "Hackeo y sigilo." },
  { id: "juego4", title: "Motín en la Prisión", desc: "Acción y control de áreas." },
  { id: "juego5", title: "La Fuga", desc: "Cooperativo contra reloj." },
  { id: "juego6", title: "Negociación", desc: "Social y bluffing." },
];

const PatioView: React.FC = () => {
  const players = useStore((state) => state.room.players);
  const votes = useStore((state) => state.room.votes);
  const myId = useStore((state) => state.user.id);
  const updateStatus = useStore((state) => state.updatePlayerStatus);
  const voteForGame = useStore((state) => state.voteForGame);
  
  // Encontrar mi estado actual
  const me = players.find(p => p.id === myId);
  const isReady = me?.ready || false;

  return (
    <div className="space-y-8 pb-20">
      {/* SECCIÓN 1: Votación de Juegos */}
      <section>
        <h2 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5" /> SELECCIÓN DE MISIÓN
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {JUEGOS.map((juego) => (
            <div 
              key={juego.id}
              onClick={() => voteForGame(juego.id)}
              className="group relative bg-neutral-800/50 border border-neutral-700 p-4 rounded-lg cursor-pointer hover:border-red-500 transition-all hover:bg-neutral-800 active:scale-95"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-neutral-200 group-hover:text-red-400 transition-colors">
                  {juego.title}
                </h3>
                <div className="flex items-center gap-1 text-xs font-mono bg-neutral-900 px-2 py-1 rounded text-neutral-400">
                  <ThumbsUp className="w-3 h-3" />
                  {votes[juego.id] || 0}
                </div>
              </div>
              <p className="text-sm text-neutral-500">{juego.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECCIÓN 2: Estado del Jugador (Ready Check) */}
      <section className="bg-neutral-800/30 p-6 rounded-xl border border-neutral-800 text-center">
        <h3 className="text-neutral-400 text-sm mb-4 uppercase tracking-widest">Estado del Agente</h3>
        <button
          onClick={() => updateStatus(!isReady)}
          className={`w-full max-w-xs px-8 py-4 rounded-full font-bold text-xl transition-all shadow-lg flex items-center justify-center gap-3 mx-auto ${
            isReady 
              ? "bg-green-600 hover:bg-green-700 text-white shadow-green-900/20" 
              : "bg-red-600 hover:bg-red-700 text-white shadow-red-900/20"
          }`}
        >
          {isReady ? <CheckCircle /> : <XCircle />}
          {isReady ? "LISTO PARA LA ACCIÓN" : "NO ESTOY LISTO"}
        </button>
      </section>

      {/* SECCIÓN 3: Lista de Operativos */}
      <section>
        <h2 className="text-xl font-bold text-neutral-400 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" /> OPERATIVOS EN LÍNEA ({players.length})
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {players.map((player) => (
            <div 
              key={player.id} 
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                player.ready 
                  ? "bg-green-900/10 border-green-900/50" 
                  : "bg-neutral-800 border-neutral-700"
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${player.ready ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'}`} />
              <div className="flex flex-col">
                <span className={`font-mono font-bold ${player.ready ? 'text-green-400' : 'text-neutral-400'}`}>
                  {player.nickname}
                </span>
                <span className="text-[10px] uppercase text-neutral-600">
                  {player.isGM ? "Director" : "Agente"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PatioView;