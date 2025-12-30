import React, { useState } from "react";
import { useStore } from "../store";
import {
  CheckCircle2,
  XCircle,
  Users,
  Trophy,
  User,
  Circle,
  Info,
  HelpCircle,
} from "lucide-react";
import ManualModal from "./ManualModal";

const GAMES = [
  { id: "g1", title: "Atraco a la Fábrica", type: "Asalto" },
  { id: "g2", title: "Plan Chernobyl", type: "Sigilo" },
  { id: "g3", title: "Protocolo Valencia", type: "Caos" },
  { id: "g4", title: "La Casa de Toledo", type: "Estrategia" },
  { id: "g5", title: "Fuga del Banco", type: "Escape" },
  { id: "g6", title: "Código Rojo", type: "Supervivencia" },
];

const PatioView: React.FC = () => {
  const nickname = useStore((state) => state.user.nickname);
  const userId = useStore((state) => state.user.id);
  const players = useStore((state) => state.room.players);
  const votes = useStore((state) => state.room.votes);
  const voteForGame = useStore((state) => state.voteForGame);
  const updatePlayerStatus = useStore((state) => state.updatePlayerStatus);

  const [manualGame, setManualGame] = useState<{
    isOpen: boolean;
    title: string;
  }>({
    isOpen: false,
    title: "",
  });

  // Encuentro mi estado actual de "ready" directamente del store
  const me = players.find((p) => p.id === userId);
  const isReady = me?.ready || false;

  const handleToggleReady = () => {
    updatePlayerStatus(!isReady);
  };

  const openManual = (e: React.MouseEvent, title: string) => {
    e.stopPropagation();
    setManualGame({ isOpen: true, title });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
            Sala de Planificación
          </h2>
          <p className="text-neutral-400 text-sm font-mono">
            Elije el objetivo y confirma tu estado.
          </p>
        </div>
        <div className="bg-neutral-800 px-3 py-1 rounded-full border border-neutral-700 flex items-center gap-2">
          <Users size={14} className="text-green-500" />
          <span className="text-xs font-bold text-white">
            {players.length}/8 Operativos
          </span>
        </div>
      </div>

      {/* Game Selection Grid */}
      <section>
        <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Trophy size={16} /> Votación de Objetivos
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {GAMES.map((game) => {
            const gameVotes = votes[game.id] || 0;
            return (
              <div key={game.id} className="relative group">
                <button
                  onClick={() => voteForGame(game.id)}
                  className="w-full relative p-4 rounded-xl border-2 text-left transition-all duration-200 bg-neutral-900/50 border-neutral-800 hover:border-neutral-600 hover:bg-neutral-800 active:scale-[0.98]"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded border bg-neutral-800 border-neutral-700 text-neutral-500 group-hover:text-neutral-300 transition-colors">
                      {game.type}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-green-500/80 bg-green-500/10 px-1.5 py-0.5 rounded">
                        +{gameVotes}
                      </span>
                    </div>
                  </div>
                  <h4 className="font-bold text-sm mb-1 text-neutral-300 group-hover:text-white transition-colors">
                    {game.title}
                  </h4>
                </button>

                {/* Info Button */}
                <button
                  onClick={(e) => openManual(e, game.title)}
                  className="absolute bottom-3 right-3 p-1.5 rounded-full bg-neutral-800/50 text-neutral-500 hover:text-blue-400 hover:bg-neutral-700 border border-transparent hover:border-blue-500/30 transition-all z-10"
                  title="Ver Manual"
                >
                  <HelpCircle size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Player Status Switch */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-2">
            Tu Estado
          </h3>
          <button
            onClick={handleToggleReady}
            className={`w-full py-6 rounded-2xl border-2 flex items-center justify-center gap-4 transition-all duration-300 transform active:scale-95 shadow-lg
                    ${
                      isReady
                        ? "bg-green-600 border-green-400 text-white shadow-green-900/20"
                        : "bg-neutral-900 border-red-900/50 text-red-500 hover:bg-red-950/10"
                    }`}
          >
            {isReady ? (
              <>
                <CheckCircle2 size={32} />
                <span className="text-2xl font-black tracking-widest uppercase">
                  Listo
                </span>
              </>
            ) : (
              <>
                <XCircle size={32} />
                <span className="text-2xl font-black tracking-widest uppercase">
                  No Listo
                </span>
              </>
            )}
          </button>
          <p className="text-center text-xs text-neutral-500 font-mono">
            {isReady
              ? "Esperando confirmación del Director..."
              : "Marca cuando hayas revisado tu equipo."}
          </p>
        </section>

        {/* Player List */}
        <section className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
          <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users size={16} /> Pelotón Operativo
          </h3>
          <div className="space-y-2 max-h-[250px] overflow-y-auto no-scrollbar">
            {players.map((player) => {
              const isMe = player.id === userId;
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    isMe
                      ? "bg-neutral-800/80 border-neutral-700"
                      : "border-transparent hover:bg-neutral-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        isMe
                          ? "bg-neutral-700 text-neutral-300"
                          : "bg-neutral-800 text-neutral-500"
                      }`}
                    >
                      <User size={16} />
                    </div>
                    <span
                      className={`font-bold ${
                        isMe ? "text-white" : "text-neutral-300"
                      }`}
                    >
                      {player.nickname} {isMe && "(Tú)"}
                    </span>
                  </div>
                  {player.ready ? (
                    <Circle
                      size={10}
                      className="fill-green-600 text-green-600 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                    />
                  ) : (
                    <Circle size={10} className="stroke-red-900 text-red-900" />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <ManualModal
        isOpen={manualGame.isOpen}
        onClose={() => setManualGame({ ...manualGame, isOpen: false })}
        gameTitle={manualGame.title}
      />
    </div>
  );
};

export default PatioView;
