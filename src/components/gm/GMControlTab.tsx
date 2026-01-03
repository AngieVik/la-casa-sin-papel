import React from "react";
import { Users, CheckCircle2, Clock, Edit2 } from "lucide-react";
import { Player } from "../../types";

interface GMControlTabProps {
  players: Player[];
  onEditPlayer: (playerId: string) => void;
}

const GMControlTab: React.FC<GMControlTabProps> = ({
  players,
  onEditPlayer,
}) => {
  const nonGMPlayers = players.filter((p) => !p.isGM);

  return (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
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
