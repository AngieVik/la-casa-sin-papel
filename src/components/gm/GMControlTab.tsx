import React from "react";
import {
  Users,
  CheckCircle2,
  Clock,
  Edit2,
  BookOpen,
  ShieldAlert,
} from "lucide-react";
import { Player, GameStatus } from "../../types";
import { GAMES, getGameById } from "../../constants/games";
import GameContainer from "./GameContainer";

interface GMControlTabProps {
  players: Player[];
  votes: Record<string, Record<string, boolean>>;
  gameSelected: string | null;
  gameStatus: GameStatus;
  onSelectGame: (gameId: string | null) => void;
  onEditPlayer: (playerId: string) => void;
  onOpenAudit: () => void;
}

const GMControlTab: React.FC<GMControlTabProps> = ({
  players,
  votes,
  gameSelected,
  gameStatus,
  onSelectGame,
  onEditPlayer,
  onOpenAudit,
}) => {
  const nonGMPlayers = players.filter((p) => !p.isGM);

  // Map games (all are engine games now)
  const allGames = GAMES.map((g) => ({
    id: g.id,
    title: g.title,
    desc: g.description,
  }));

  return (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
      {/* Game Selector OR GameContainer */}
      {gameStatus !== "lobby" && gameSelected && getGameById(gameSelected) ? (
        // Show GameContainer when game is active
        <GameContainer />
      ) : (
        // Show game selector in lobby
        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
          <h4 className="text-neutral-300 font-bold mb-2 flex items-center gap-2">
            <BookOpen size={16} /> Selector de Juego
          </h4>
          <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-1">
            {allGames.map((game) => {
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
                      : "bg-indigo-900/20 border-indigo-700 hover:border-indigo-500"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h5
                        className={`font-bold ${
                          isSelected ? "text-green-400" : "text-indigo-300"
                        }`}
                      >
                        {game.title}
                        <span className="ml-1 text-[8px] bg-indigo-600 text-white px-1 rounded">
                          ENGINE
                        </span>
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
      )}

      {/* Players Section */}
      <div className="flex justify-between items-center w-full">
        <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider">
          Jugadores ({nonGMPlayers.length})
        </h3>
        <button
          onClick={onOpenAudit}
          className="text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-400 px-2 py-1 rounded border border-neutral-700 transition-colors flex items-center gap-1"
        >
          <ShieldAlert size={16} /> Auditoría
        </button>
      </div>

      {/* Contenedor Flexbox con wrapping y ajuste de ancho basado en el contenido */}
      <div className="flex flex-wrap gap-3 w-full justify-start items-stretch">
        {nonGMPlayers.map((player) => (
          <button
            key={player.id}
            onClick={() => onEditPlayer(player.id)}
            className="flex-1 min-w-fit max-w-sm bg-neutral-950 border border-neutral-800 p-3 rounded-xl flex items-center justify-between group hover:border-neutral-600 transition-all text-left hover:bg-neutral-900"
          >
            <div className="flex items-center gap-3">
              {/* Icono de Usuario con indicador de estado */}
              <div
                className={`p-3 rounded-full flex-shrink-0 ${
                  player.ready
                    ? "bg-green-500/10 text-green-500 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.1)]"
                    : "bg-neutral-800 text-neutral-600 border border-neutral-700"
                }`}
              >
                <Users size={18} />
              </div>

              {/* Información del Jugador */}
              <div className="flex flex-col min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-lg whitespace-nowrap">
                    {player.nickname}
                  </span>
                  {player.ready ? (
                    <CheckCircle2
                      size={14}
                      className="text-green-500 flex-shrink-0"
                    />
                  ) : (
                    <Clock
                      size={14}
                      className="text-yellow-500/50 flex-shrink-0"
                    />
                  )}
                </div>

                {/* Rol del Jugador */}
                <div className="text-xs text-neutral-500 font-mono uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">
                  {(player.roles || []).length > 0
                    ? (player.roles || []).join(", ")
                    : "Sin Rol"}
                </div>

                {/* Estados Públicos (Azules) */}
                {(player.publicStates || []).length > 0 && (
                  <div className="text-xs text-blue-400 mt-1 flex flex-wrap gap-1">
                    {(player.publicStates || []).map((state) => (
                      <span
                        key={state}
                        className="bg-blue-900/30 px-1 rounded border border-blue-900/20 whitespace-nowrap"
                      >
                        {state}
                      </span>
                    ))}
                  </div>
                )}

                {/* Estados Privados (Púrpura) */}
                {(player.playerStates || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-[10px] text-purple-400 mr-1">🔒</span>
                    {(player.playerStates || []).map((state) => (
                      <span
                        key={state}
                        className="bg-purple-900/30 text-purple-400 text-[10px] px-1 rounded border border-purple-900/50 whitespace-nowrap"
                      >
                        {state}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </button>
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
