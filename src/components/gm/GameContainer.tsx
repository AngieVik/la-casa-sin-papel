import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "../../store";
import { getGameById } from "../../constants/games";

/**
 * GameContainer - Gestiona la partida activa
 * Solo muestra controles de fase y el componente del juego
 */
const GameContainer: React.FC = () => {
  const gameSelected = useStore((state) => state.room.gameSelected);
  const gamePhase = useStore((state) => state.room.gamePhase);
  const setGamePhase = useStore((state) => state.setGamePhase);

  // Obtener el módulo del juego actual
  const gameModule = gameSelected ? getGameById(gameSelected) : null;

  // Navegar entre fases
  const handlePrevPhase = () => {
    if (gamePhase > 0) {
      setGamePhase(gamePhase - 1);
    }
  };

  const handleNextPhase = () => {
    setGamePhase(gamePhase + 1);
  };

  if (!gameModule) {
    return (
      <div className="text-center py-12 text-neutral-500">
        No hay juego seleccionado
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
      {/* Barra de Control de Fases */}
      <div className="flex items-center justify-between p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-neutral-500 uppercase tracking-wider">
            Fase actual:
          </span>
          <span className="text-xl font-black text-white bg-neutral-800 px-3 py-1 rounded-lg">
            {gamePhase}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPhase}
            disabled={gamePhase === 0}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            title="Fase anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleNextPhase}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
            title="Siguiente fase"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Renderiza el componente del juego */}
      <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl">
        <gameModule.Component />
      </div>
    </div>
  );
};

export default GameContainer;
