import { GameModule } from "../types";
import TestGame, { testGameMeta } from "../games/TestGame";

/**
 * GAMES - Registro de juegos disponibles
 * Cada juego es un módulo del Game Engine
 */
export const GAMES: GameModule[] = [
  {
    ...testGameMeta,
    Component: TestGame,
  },
];

/**
 * Obtiene un juego por su ID
 */
export const getGameById = (id: string): GameModule | undefined => {
  return GAMES.find((g) => g.id === id);
};
