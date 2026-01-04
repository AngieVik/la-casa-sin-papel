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
      <div className="text-center text-neutral-500">
        No hay juego seleccionado
      </div>
    );
  }

  return (
    <div className="animate-in slide-in-from-bottom-2 duration-300">
      {/* Barra de Control de Fases */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-2xl font-bold text-neutral-500 tracking-wider">
            Fase actual
          </span>
          <span className="text-2xl font-black text-white">
            {gamePhase}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPhase}
            disabled={gamePhase === 0}
            className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            title="Fase anterior"
          >
            <ChevronLeft size={40} />
          </button>
          <button
            onClick={handleNextPhase}
            className="bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
            title="Siguiente fase"
          >
            <ChevronRight size={40} />
          </button>
        </div>
      </div>

      {/* Renderiza el componente del juego */}
      <div className="rounded-xl">
        <React.Suspense
          fallback={
            <div className="flex items-center justify-center h-64 text-neutral-500 animate-pulse">
              Cargando juego...
            </div>
          }
        >
          <gameModule.Component />
        </React.Suspense>
      </div>
    </div>
  );
};

export default GameContainer;
