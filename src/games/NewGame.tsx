import React from "react";
import { GameMetadata } from "../types";

// ==========================================
// 1. CONFIGURACIÓN DEL JUEGO (METADATA)
// ==========================================
export const newGameMeta: GameMetadata = {
  // @ts-expect-error - Añade tu ID a GameId en types.ts
  id: "new_game", // ID único del juego (debe estar en GameId)
  title: "", // Título visible (ej: "Hombres Lobo")
  description: "", // Breve descripción
  minRoles: [], // Roles mínimos requeridos para Fase 0
  specificData: {
    roles: [], // Roles específicos del juego
    playerStates: [], // Estados privados (ej: "Enamorado")
    publicStates: [], // Estados públicos (ej: "Sheriff")
    globalStates: [], // Estados globales (ej: "Fase de Discusión")
  },
  icon: undefined, // Importa un icono de lucide-react (ej: Moon)
  themeColor: "", // Color temático (ej: "text-purple-500")
};

// ==========================================
// 2. LÓGICA DEL JUEGO (HOOK PERSONALIZADO)
// ==========================================
// Recomendación: Mover a un archivo separado (ej: useNewGame.ts) si crece mucho
const useGameLogic = () => {
  // TODO: Estado y lógica aquí
  const [exampleState, setExampleState] = React.useState(0);

  const handleAction = () => {
    console.log("Acción ejecutada");
    setExampleState((prev) => prev + 1);
  };

  return {
    exampleState,
    handleAction,
  };
};

// ==========================================
// 3. COMPONENTE PRINCIPAL
// ==========================================
const NewGame: React.FC = () => {
  const { exampleState, handleAction } = useGameLogic();

  return (
    <div className="space-y-6 p-4">
      <div className="text-center">
        <h2 className="text-2xl font-black text-white mb-2">
          🎮 {newGameMeta.title || "Nuevo Juego"}
        </h2>
        <p className="text-neutral-500 text-sm">
          {newGameMeta.description || "Descripción del juego..."}
        </p>
      </div>

      {/* UI Area */}
      <div className="p-8 border border-dashed border-neutral-700 rounded-xl text-center text-neutral-500">
        <p>Estado de prueba: {exampleState}</p>
        <button
          onClick={handleAction}
          className="mt-4 px-4 py-2 bg-neutral-800 rounded-lg hover:bg-neutral-700 text-white text-sm"
        >
          Ejecutar Acción
        </button>
      </div>
    </div>
  );
};

export default NewGame;
