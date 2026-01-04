import React, { useState } from "react";
import {
  Globe,
  Eye,
  EyeOff,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Fingerprint,
  Shuffle,
  Play,
  Users,
} from "lucide-react";
import { useStore } from "../../store";
import { GAMES, getGameById } from "../../constants/games";

interface GMNarrativeTabProps {
  globalStates: string[];
  playerStates: string[];
  publicStates: string[];
  roles: string[];
  currentGlobalState: string;
  onAddState: (type: "global" | "player" | "public" | "role") => void;
  onEditState: (
    type: "global" | "player" | "public" | "role",
    value: string
  ) => void;
  onDeleteState: (
    type: "global" | "player" | "public" | "role",
    value: string
  ) => void;
  onAssignState: (type: "player" | "public", value: string) => void;
}

const GMNarrativeTab: React.FC<GMNarrativeTabProps> = ({
  globalStates,
  playerStates,
  publicStates,
  roles,
  currentGlobalState,
  onAddState,
  onEditState,
  onDeleteState,
  onAssignState,
}) => {
  const gmUpdateGlobalState = useStore((s) => s.gmUpdateGlobalState);
  const gameSelected = useStore((s) => s.room.gameSelected);
  const gamePhase = useStore((s) => s.room.gamePhase);
  const players = useStore((s) => s.room.players);
  const setGamePhase = useStore((s) => s.setGamePhase);
  const gmTogglePlayerRole = useStore((s) => s.gmTogglePlayerRole);

  const [isDistributing, setIsDistributing] = useState(false);

  // Get active game
  const activeGame = gameSelected ? getGameById(gameSelected) : null;

  // Non-GM players
  const nonGMPlayers = players.filter((p) => !p.isGM);

  // Check if all minRoles are assigned
  const checkMinRolesAssigned = (): boolean => {
    if (!activeGame) return false;

    const assignedRoles = new Set<string>();
    nonGMPlayers.forEach((p) => {
      (p.roles || []).forEach((r) => assignedRoles.add(r));
    });

    return activeGame.minRoles.every((role) => assignedRoles.has(role));
  };

  // Role distribution logic
  const distributeRolesRandomly = async () => {
    if (!activeGame || nonGMPlayers.length === 0) return;

    setIsDistributing(true);

    const minRoles = [...activeGame.minRoles];
    const availablePlayers = [...nonGMPlayers];

    // Check if enough players
    if (availablePlayers.length < minRoles.length) {
      alert("No hay suficientes jugadores para los roles mínimos");
      setIsDistributing(false);
      return;
    }

    // Clean previous game roles from all players
    for (const player of availablePlayers) {
      const currentRoles = player.roles || [];
      for (const role of currentRoles) {
        if (minRoles.includes(role)) {
          await gmTogglePlayerRole(player.id, role);
        }
      }
    }

    // Shuffle players
    const shuffledPlayers = availablePlayers.sort(() => Math.random() - 0.5);

    // Assign minRoles
    for (let i = 0; i < minRoles.length; i++) {
      await gmTogglePlayerRole(shuffledPlayers[i].id, minRoles[i]);
    }

    setIsDistributing(false);
  };

  // CLASE DEFINITIVA:
  // - pb-8 crea un "puente" invisible para que el ratón nunca deje de estar encima.
  // - visibility + transition-all hace que el botón sea clickable durante todo el delay.
  const actionButtonsClasses = `
    absolute -top-7 -right-1 flex gap-1 z-20 
    opacity-0 invisible pb-8 
    transition-all duration-300 delay-700 
    group-hover:opacity-100 group-hover:visible group-hover:delay-0
    hover:delay-0
  `;

  const renderStateGroup = (
    title: string,
    states: string[],
    type: "global" | "player" | "public" | "role",
    icon: React.ReactNode,
    colorClasses: {
      normal: string;
      active?: string;
    }
  ) => (
    <div className="space-y-4 md:col-span-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-neutral-500 tracking-wider uppercase flex items-center gap-2">
          {title} {icon}
        </label>
        <button
          onClick={() => onAddState(type)}
          className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-green-500 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-1">
        {states.map((state) => (
          <div
            key={state}
            className="relative group block"
            onClick={() => {
              if (type === "global") {
                currentGlobalState === state
                  ? gmUpdateGlobalState("")
                  : gmUpdateGlobalState(state);
              } else if (type === "role") {
                onAssignState("role", state);
              } else {
                onAssignState(type as "player" | "public", state);
              }
            }}
          >
            <button
              className={`w-full p-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-between ${
                type === "global" && currentGlobalState === state
                  ? colorClasses.active ||
                    "bg-green-600 border-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                  : colorClasses.normal
              }`}
            >
              <span className="truncate">{state}</span>
              {type === "global" && currentGlobalState === state ? (
                <CheckCircle2 size={14} className="shrink-0 ml-2" />
              ) : (
                icon
              )}
            </button>
            <div className={actionButtonsClasses}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditState(type, state);
                }}
                className="p-1.5 bg-blue-600 rounded-full text-white hover:bg-blue-400 shadow-lg"
              >
                <Edit2 size={10} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteState(type, state);
                }}
                className="p-1.5 bg-red-600 rounded-full text-white hover:bg-red-400 shadow-lg"
              >
                <Trash2 size={10} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y- animate-in slide-in-from-right-4 duration-300">
      {/* Setup Panel - Only shown when gamePhase === 0 and there's a game */}
      {activeGame && gamePhase === 0 && (
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-neutral-400" />
            <h3 className="text-lg font-black text-neutral-300">
               {activeGame.title}
            </h3>
          </div>

          {/* Min Roles List */}
          <div className="p-4 bg-neutral-950/50 border border-indigo-900/30 rounded-lg">
            <h4 className="text-sm font-bold text-neutral-400  tracking-wider mb-3">
              Roles Mínimos Requeridos
            </h4>
            <div className="flex flex-wrap gap-2">
              {activeGame.minRoles.map((role) => {
                const isAssigned = nonGMPlayers.some((p) =>
                  (p.roles || []).includes(role)
                );
                const assignedTo = nonGMPlayers.find((p) =>
                  (p.roles || []).includes(role)
                );
                return (
                  <div
                    key={role}
                    className={`px-3 py-2 rounded-lg border text-sm font-bold transition-all ${
                      isAssigned
                        ? "bg-green-900/30 border-green-500/50 text-green-400"
                        : "bg-neutral-800 border-neutral-700 text-neutral-400"
                    }`}
                  >
                    {role}
                    {assignedTo && (
                      <span className="ml-2 text-xs text-neutral-500">
                        → {assignedTo.nickname}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={distributeRolesRandomly}
              disabled={isDistributing || nonGMPlayers.length === 0}
              className="flex items-center gap-2 px-2 py-2 bg-neutral-600 hover:bg-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
            >
              <Shuffle
                size={18}
                className={isDistributing ? "animate-spin" : ""}
              />
              Repartir Aleatoriamente
            </button>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ROL Section - At the top */}
        {renderStateGroup("ROL", roles, "role", <Fingerprint size={14} />, {
          normal:
            "bg-teal-950/20 border-teal-900/50 text-teal-400 hover:border-teal-500 hover:bg-teal-950/30",
        })}

        {renderStateGroup(
          "Estado Global",
          globalStates,
          "global",
          <Globe size={14} />,
          {
            normal:
              "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-600",
            active:
              "bg-green-600 border-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]",
          }
        )}
        {renderStateGroup(
          "Estados Personales",
          playerStates,
          "player",
          <EyeOff size={14} />,
          {
            normal:
              "bg-purple-950/20 border-purple-900/50 text-purple-400 hover:border-purple-500 hover:bg-purple-950/30",
          }
        )}
        {renderStateGroup(
          "Estados Públicos",
          publicStates,
          "public",
          <Eye size={14} />,
          {
            normal:
              "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-600",
          }
        )}
      </div>
    </div>
  );
};

export default GMNarrativeTab;
