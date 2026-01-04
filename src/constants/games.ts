import React from "react";
import { GameModule } from "../types";
import { testGameMeta } from "../games/TestGame";
import { LosHombresLoboMetadata } from "../games/LosHombresLoboDeCampohermoso";

const TestGame = React.lazy(() => import("../games/TestGame"));
const LosHombresLobo = React.lazy(
  () => import("../games/LosHombresLoboDeCampohermoso")
);

/**
 * GAMES - Registro de juegos disponibles
 * Cada juego es un módulo del Game Engine
 */
export const GAMES: GameModule[] = [
  {
    ...testGameMeta,
    Component: TestGame,
  },
  {
    ...LosHombresLoboMetadata,
    Component: LosHombresLobo,
  },
];

/**
 * Obtiene un juego por su ID
 */
export const getGameById = (id: string): GameModule | undefined => {
  return GAMES.find((g) => g.id === id);
};
