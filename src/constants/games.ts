import { GameModule } from "../types";
import TestGame from "../games/TestGame";

/**
 * GAMES - Registro de juegos disponibles
 * Cada juego es un módulo del Game Engine
 */
export const GAMES: GameModule[] = [
  {
    id: "test_game",
    title: "Juego de Prueba",
    description: "Un juego simple para testear el motor de juegos.",
    minRoles: ["Dado", "Moneda"],
    specificData: {
      roles: ["Dado", "Moneda"],
      playerStates: ["Afortunado"],
      publicStates: ["Ganador"],
      globalStates: ["Ronda Activa"],
    },
    Component: TestGame,
  },
];

/**
 * Obtiene un juego por su ID
 */
export const getGameById = (id: string): GameModule | undefined => {
  return GAMES.find((g) => g.id === id);
};
