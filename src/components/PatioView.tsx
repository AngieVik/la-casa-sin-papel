import React from "react";
import { useStore } from "../store";
import {
  Users,
  CheckCircle,
  XCircle,
  BookOpen,
  ThumbsUp,
  Info,
} from "lucide-react";
import ModalWrapper from "./ModalWrapper";
import { GAMES } from "../constants/games";

const PatioView: React.FC = () => {
  const players = useStore((state) => state.room.players);
  const votes = useStore((state) => state.room.votes);
  const myId = useStore((state) => state.user.id);
  const updateStatus = useStore((state) => state.updatePlayerStatus);
  const voteForGame = useStore((state) => state.voteForGame);

  // Encontrar mi estado actual
  const me = players.find((p) => p.id === myId);
  const isReady = me?.ready || false;

  const [selectedGame, setSelectedGame] = React.useState<
    (typeof GAMES)[number] | null
  >(null);

  const getVoteCount = (juegoId: string) => {
    const gameVotes = votes[juegoId];
    return gameVotes ? Object.keys(gameVotes).length : 0;
  };

  const hasVoted = (juegoId: string) => {
    return !!(votes[juegoId] && myId && votes[juegoId][myId]);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* SECCIÓN 1: Votación de Juegos */}
      <section>
        <h2 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5" /> Votación de juego
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {GAMES.map((juego) => (
            <div
              key={juego.id}
              className="group relative bg-neutral-800/50 border border-neutral-700 p-4 rounded-lg hover:border-red-900/50 transition-all hover:bg-neutral-800 overflow-hidden"
            >
              <div className="flex gap-2 relative z-10">
                {/* Columna Izquierda: Título, descripción e info */}
                <div className="flex-1">
                  <h3 className="font-bold text-auto inline text-neutral-200 group-hover:text-red-400 transition-colors mb-1">
                    {juego.title}
                  </h3>
                  <p className="hidden sm:block text-sm text-neutral-500">
                    {juego.desc}
                  </p>
                  <div
                    onClick={() => setSelectedGame(juego)}
                    className="flex items-center gap-1 text-[11px] text-red-500/50 font-mono uppercase tracking-tighter cursor-pointer hover:text-red-400"
                  >
                    <Info size={16} /> Instrucciones
                  </div>
                </div>

                {/* Columna Derecha: Botón de Pulgar (Voto) */}
                <div className="flex flex-col items-center justify-start">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      voteForGame(juego.id);
                    }}
                    className={`flex flex-col items-center rounded-lg transition-all ${
                      hasVoted(juego.id)
                        ? "text-red-600 scale-110 shadow-lg shadow-red-900/40"
                        : "text-neutral-400 hover:text-red-500"
                    }`}
                  >
                    <ThumbsUp
                      className={`${
                        hasVoted(juego.id) ? "w-6 h-6" : "w-5 h-5"
                      }`}
                    />
                    <span className="text-xs font-mono font-bold">
                      {getVoteCount(juego.id)}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MODAL DE INSTRUCCIONES */}
      {selectedGame && (
        <ModalWrapper
          title={selectedGame.title}
          onClose={() => setSelectedGame(null)}
        >
          <div className="space-y-4">
            <div className="p-4 bg-red-900/10 border border-red-900/30 rounded-lg">
              <h4 className="text-red-500 font-bold uppercase text-xs mb-2 tracking-widest">
                Protocolo de Misión
              </h4>
              <p className="text-neutral-300 italic text-sm">
                "Instrucciones, próximamente. El Alto Mando está procesando los
                datos de este operativo."
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-neutral-800 rounded border border-neutral-700">
                <span className="block text-[10px] text-neutral-500 uppercase">
                  Dificultad
                </span>
                <span className="text-red-400 font-mono">CLASIFICADO</span>
              </div>
              <div className="p-3 bg-neutral-800 rounded border border-neutral-700">
                <span className="block text-[10px] text-neutral-500 uppercase">
                  Recompensa
                </span>
                <span className="text-green-500 font-mono">ALTA</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedGame(null)}
              className="w-full py-3 bg-neutral-100 hover:bg-white text-black font-bold rounded-lg transition-colors"
            >
              ENTENDIDO
            </button>
          </div>
        </ModalWrapper>
      )}

      {/* SECCIÓN 2: Estado del Jugador (Ready Check) */}
      <section className="p-2 border-neutral-800 text-center">
        <button
          onClick={() => updateStatus(!isReady)}
          className={`w-full max-w-xs py-6 rounded-full font-bold text-xl transition-all shadow-lg flex items-center justify-center gap-2 mx-auto ${
            isReady
              ? "bg-green-600 hover:bg-green-700 text-white shadow-green-900/20"
              : "bg-red-600 hover:bg-red-700 text-white shadow-red-900/20"
          }`}
        >
          {isReady ? <CheckCircle /> : <XCircle />}
          {isReady ? "LISTO PARA LA ACCIÓN" : "NO ESTOY LISTO"}
        </button>
      </section>

      {/* SECCIÓN 3: Lista de Jugadores */}
      <section>
        <h2 className="text-xl font-bold text-neutral-400 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" /> Jugadores ({players.length})
        </h2>
        <div className="flex flex-wrap gap-2 w-full justify-start items-stretch">
          {players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center gap-2 p-2 rounded-lg border min-w-fit flex-1 max-w-sm ${
                player.ready
                  ? "bg-green-900/10 border-green-900/50"
                  : "bg-neutral-800 border-neutral-700"
              }`}
            >
              {/* Indicador de estado */}
              <div
                className={`w-5 h-5 rounded-full flex-shrink-0 ${
                  player.ready
                    ? "bg-green-500 shadow-[0_0_10px_#22c55e]"
                    : "bg-red-500"
                }`}
              />

              {/* Contenedor de texto */}
              <div className="flex flex-col min-w-0 pr-2">
                <span
                  className={`font-mono font-bold text-[clamp(0.8rem,1.6vw,1.6rem)] leading-none whitespace-nowrap ${
                    player.ready ? "text-green-400" : "text-neutral-200"
                  }`}
                >
                  {player.nickname}
                </span>
                <span className="uppercase text-neutral-400 text-[clamp(0.5rem,1vw,1rem)] leading-none whitespace-nowrap">
                  {player.isGM ? "GM" : "Jugador"}
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
