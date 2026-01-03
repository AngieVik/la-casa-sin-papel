import React from "react";
import { GameMetadata } from "../types";

// ==========================================
// 1. CONFIGURACIÓN DEL JUEGO (METADATA)
// ==========================================
export const newGameMeta: GameMetadata = {
  id: "", // ID único del juego (ej: "werewolf")
  title: "", // Título visible (ej: "Hombres Lobo")
  description: "", // Breve descripción
  minRoles: [], // Roles mínimos requeridos para Fase 0
  specificData: {
    roles: [], // Roles específicos del juego
    playerStates: [], // Estados privados (ej: "Enamorado")
    publicStates: [], // Estados públicos (ej: "Sheriff")
    globalStates: [], // Estados globales (ej: "Fase de Discusión")
  },
};

// ==========================================
// 2. COMPONENTE PRINCIPAL
// ==========================================
const NewGame: React.FC = () => {
  // TODO: Hooks y lógica del juego aquí
  // const { room } = useStore((state) => state); (Si necesitas estado global)

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

      {/* TODO: Implementar UI del juego */}
      <div className="p-8 border border-dashed border-neutral-700 rounded-xl text-center text-neutral-500">
        <p>Aquí va la interfaz del juego.</p>
        <p className="text-xs mt-2">Edita src/games/NewGame.tsx</p>
      </div>
    </div>
  );
};

export default NewGame;
