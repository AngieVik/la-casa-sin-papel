import React from "react";
import {
  BookOpen,
  Globe,
  Eye,
  EyeOff,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { useStore } from "../../store";
import { GAMES } from "../../constants/games";
import { Player } from "../../types";

interface GMNarrativeTabProps {
  votes: Record<string, Record<string, boolean>>;
  globalStates: string[];
  playerStates: string[];
  publicStates: string[];
  currentGlobalState: string;
  onAddState: (type: "global" | "player" | "public") => void;
  onEditState: (type: "global" | "player" | "public", value: string) => void;
  onDeleteState: (type: "global" | "player" | "public", value: string) => void;
  onAssignState: (type: "player" | "public", value: string) => void;
}

const GMNarrativeTab: React.FC<GMNarrativeTabProps> = ({
  votes,
  globalStates,
  playerStates,
  publicStates,
  currentGlobalState,
  onAddState,
  onEditState,
  onDeleteState,
  onAssignState,
}) => {
  const gmUpdateGlobalState = useStore((s) => s.gmUpdateGlobalState);
  const gmSelectGame = useStore((s) => s.gmSelectGame);
  const gameSelected = useStore((s) => s.room.gameSelected);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-right-4 duration-300">
      {/* GAME SELECTOR */}
      <div className="md:col-span-2 p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
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
                onClick={() => gmSelectGame(game.id)}
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

      {/* Global State */}
      <div className="space-y-4 md:col-span-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-neutral-500 tracking-wider uppercase flex items-center gap-2">
            Estado Global (Fase) <Globe size={14} />
          </label>
          <button
            onClick={() => onAddState("global")}
            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-green-500 transition-colors"
            title="Añadir estado"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-1">
          {globalStates.map((state) => (
            <div key={state} className="relative group">
              <button
                onClick={() => {
                  if (currentGlobalState === state) {
                    gmUpdateGlobalState("");
                  } else {
                    gmUpdateGlobalState(state);
                  }
                }}
                className={`w-full p-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-between ${
                  currentGlobalState === state
                    ? "bg-green-600 border-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-600"
                }`}
              >
                <span className="truncate">{state}</span>
                {currentGlobalState === state && (
                  <CheckCircle2 size={14} className="shrink-0 ml-2" />
                )}
              </button>
              <div className="absolute -top-6 -right-1 hidden group-hover:flex gap-1 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditState("global", state);
                  }}
                  className="p-1.5 bg-blue-600 rounded-full text-white hover:bg-blue-500 shadow-lg"
                  title="Editar"
                >
                  <Edit2 size={10} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteState("global", state);
                  }}
                  className="p-1.5 bg-red-600 rounded-full text-white hover:bg-red-500 shadow-lg"
                  title="Borrar"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Personal States (PlayerState) */}
      <div className="space-y-4 md:col-span-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
            Estados Personales <EyeOff size={14} />
          </label>
          <button
            onClick={() => onAddState("player")}
            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-green-500 transition-colors"
            title="Añadir estado"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-1">
          {playerStates.map((state) => (
            <div key={state} className="relative group">
              <button
                onClick={() => onAssignState("player", state)}
                className="w-full p-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-between bg-purple-950/20 border-purple-900/50 text-purple-400 hover:border-purple-500 hover:bg-purple-950/30"
              >
                <span className="truncate">{state}</span>
                <EyeOff size={14} className="shrink-0 ml-2" />
              </button>
              <div className="absolute -top-6 -right-1 hidden group-hover:flex gap-1 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditState("player", state);
                  }}
                  className="p-1.5 bg-blue-600 rounded-full text-white hover:bg-blue-500 shadow-lg"
                  title="Editar"
                >
                  <Edit2 size={10} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteState("player", state);
                  }}
                  className="p-1.5 bg-red-600 rounded-full text-white hover:bg-red-500 shadow-lg"
                  title="Borrar"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Public States (PublicState) */}
      <div className="space-y-4 md:col-span-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
            Estados Públicos (Visible) <Eye size={14} />
          </label>
          <button
            onClick={() => onAddState("public")}
            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-green-500 transition-colors"
            title="Añadir estado"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-1">
          {publicStates.map((state) => (
            <div key={state} className="relative group">
              <button
                onClick={() => onAssignState("public", state)}
                className="w-full p-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-between bg-blue-950/20 border-blue-900/50 text-blue-400 hover:border-blue-500 hover:bg-blue-950/30"
              >
                <span className="truncate">{state}</span>
                <Eye size={14} className="shrink-0 ml-2" />
              </button>
              <div className="absolute -top-6 -right-1 hidden group-hover:flex gap-1 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditState("public", state);
                  }}
                  className="p-1.5 bg-blue-600 rounded-full text-white hover:bg-blue-500 shadow-lg"
                  title="Editar"
                >
                  <Edit2 size={10} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteState("public", state);
                  }}
                  className="p-1.5 bg-red-600 rounded-full text-white hover:bg-red-500 shadow-lg"
                  title="Borrar"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GMNarrativeTab;
