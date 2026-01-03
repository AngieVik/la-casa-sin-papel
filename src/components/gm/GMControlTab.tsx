import React from "react";
import { Users, CheckCircle2, Clock, Edit2, BookOpen } from "lucide-react";
import { Player } from "../../types";
import { GAMES } from "../../constants/games";

interface GMControlTabProps {
  players: Player[];
  votes: Record<string, Record<string, boolean>>;
  gameSelected: string | null;
  onSelectGame: (gameId: string | null) => void;
  onEditPlayer: (playerId: string) => void;
}

const GMControlTab: React.FC<GMControlTabProps> = ({
  players,
  votes,
  gameSelected,
  onSelectGame,
  onEditPlayer,
}) => {
  const nonGMPlayers = players.filter((p) => !p.isGM);

  return (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
      {/* Game Selector Section */}
      <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
        <h4 className="text-neutral-300 font-bold mb-2 flex items-center gap-2">
          <BookOpen size={16} /> Selector de Juego
        </h4>
        <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-1">
          {GAMES.map((game) => {
            const gameVotes = votes[game.id]
              ? Object.keys(votes[game.id]).length
              : 0;
            const isSelected = gameSelected === game.id;
            return (
              <button
                key={game.id}
                onClick={() => onSelectGame(isSelected ? null : game.id)}
                className={`p-4 rounded-lg border text-left transition-all relative ${
                  isSelected
                    ? "bg-green-600/20 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                    : "bg-neutral-900 border-neutral-700 hover:border-neutral-500"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h5
                      className={`font-bold ${
                        isSelected ? "text-green-400" : "text-white"
                      }`}
                    >
                      {game.title}
                    </h5>
                    <p className="text-xs text-neutral-500">{game.desc}</p>
                  </div>
                  <div
                    className={`flex items-center gap-1 p-1 rounded-full text-xs font-bold ${
                      gameVotes > 0
                        ? "bg-red-600 text-white"
                        : "bg-neutral-800 text-neutral-500"
                    }`}
                  >
                    {gameVotes}
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute top-1 right-1">
                    <CheckCircle2
                      size={16}
                      className="text-green-400 animate-pulse"
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Players Section */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider">
          Jugadores ({nonGMPlayers.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {nonGMPlayers.map((player) => (
          <div
            key={player.id}
            className="bg-neutral-950 border border-neutral-800 p-2 rounded-xl flex items-center justify-between group hover:border-neutral-600 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-full ${
                  player.ready
                    ? "bg-green-500/10 text-green-500 border border-green-500/30"
                    : "bg-neutral-800 text-neutral-600 border border-neutral-700"
                }`}
              >
                <Users size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-lg">
                    {player.nickname}
                  </span>
                  {player.ready ? (
                    <CheckCircle2 size={14} className="text-green-500" />
                  ) : (
                    <Clock size={14} className="text-yellow-500/50" />
                  )}
                </div>
                <div className="text-xs text-neutral-500 font-mono uppercase tracking-widest">
                  {player.role || "Sin Rol"}
                </div>
                {(player.publicStates || []).length > 0 && (
                  <div className="text-xs text-blue-400 mt-1 flex flex-wrap gap-1">
                    {(player.publicStates || []).map((state) => (
                      <span key={state} className="bg-blue-900/30 px-1 rounded">
                        {state}
                      </span>
                    ))}
                  </div>
                )}
                {/* Private states indicator */}
                {(player.playerStates || []).length > 0 && (
                  <span className="text-[10px] text-purple-400 font-mono">
                    🔒 {(player.playerStates || []).length} estado(s) privado(s)
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => onEditPlayer(player.id)}
              className="p-2 bg-neutral-800 rounded hover:text-red-400 text-neutral-400 transition-colors"
              title="Editar Jugador"
            >
              <Edit2 size={16} />
            </button>
          </div>
        ))}
        {nonGMPlayers.length === 0 && (
          <div className="col-span-full py-12 text-center text-neutral-600 font-mono text-sm border-2 border-dashed border-neutral-800 rounded-2xl">
            Esperando la conexión de agentes...
          </div>
        )}
      </div>
    </div>
  );
};

export default GMControlTab;
