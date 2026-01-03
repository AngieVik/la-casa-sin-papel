import React from "react";
import { GameModule } from "../types";
import { testGameMeta } from "../games/TestGame";

const TestGame = React.lazy(() => import("../games/TestGame"));

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
