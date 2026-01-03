import React, { useState } from "react";
import { Dice5, CircleDot } from "lucide-react";
import { GameMetadata } from "../types";

export const testGameMeta: GameMetadata = {
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
  icon: Dice5,
  themeColor: "text-red-500",
};

const TestGame: React.FC = () => {
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [boolResult, setBoolResult] = useState<boolean | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const rollDice = () => {
    setIsRolling(true);
    setBoolResult(null);

    // Animación de dados
    const interval = setInterval(() => {
      setDiceResult(Math.floor(Math.random() * 6) + 1);
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      setDiceResult(Math.floor(Math.random() * 6) + 1);
      setIsRolling(false);
    }, 800);
  };

  const flipCoin = () => {
    setDiceResult(null);
    setIsRolling(true);

    setTimeout(() => {
      setBoolResult(Math.random() > 0.5);
      setIsRolling(false);
    }, 500);
  };

  return (
    <div className="space-y-6 p-4">
      <div className="text-center">
        <h2 className="text-2xl font-black text-white mb-2">
          🎮 {testGameMeta.title}
        </h2>
        <p className="text-neutral-500 text-sm">{testGameMeta.description}</p>
      </div>

      {/* Resultado Display */}
      <div className="flex justify-center">
        <div
          className={`w-32 h-32 rounded-2xl flex items-center justify-center text-6xl font-black transition-all duration-300 ${
            isRolling
              ? "bg-yellow-500/20 border-2 border-yellow-500 animate-pulse"
              : diceResult !== null
              ? "bg-red-500/20 border-2 border-red-500"
              : boolResult !== null
              ? boolResult
                ? "bg-green-500/20 border-2 border-green-500"
                : "bg-red-500/20 border-2 border-red-500"
              : "bg-neutral-800 border-2 border-neutral-700"
          }`}
        >
          {isRolling ? (
            <span className="animate-bounce">🎲</span>
          ) : diceResult !== null ? (
            <span className="text-red-400">{diceResult}</span>
          ) : boolResult !== null ? (
            <span className={boolResult ? "text-green-400" : "text-red-400"}>
              {boolResult ? "✓" : "✗"}
            </span>
          ) : (
            <span className="text-neutral-600">?</span>
          )}
        </div>
      </div>

      {/* Resultado en texto */}
      <div className="text-center h-2 flex items-center justify-center">
        {(diceResult !== null || boolResult !== null) && !isRolling ? (
          <p className="text-lg font-bold text-white animate-in fade-in duration-300">
            {diceResult !== null && `¡Sacaste un ${diceResult}!`}
            {boolResult !== null && (boolResult ? "¡VERDADERO!" : "¡FALSO!")}
          </p>
        ) : null}
      </div>

      {/* Botones de Acción */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={rollDice}
          disabled={isRolling}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all transform active:scale-95 shadow-lg shadow-red-900/30"
        >
          <Dice5 size={24} />
          Tirar Dado
        </button>

        <button
          onClick={flipCoin}
          disabled={isRolling}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all transform active:scale-95 shadow-lg shadow-blue-900/30"
        >
          <CircleDot size={24} />
          Verdadero/Falso
        </button>
      </div>

      {/* Info del juego */}
      <div className="mt-8 p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl">
        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-2">
          Información del Juego
        </h3>
        <ul className="text-xs text-neutral-500 space-y-1">
          <li>• Este es un juego de prueba para validar el motor</li>
          <li>• Los roles inyectados: Dado, Moneda</li>
          <li>• Estados específicos: Afortunado, Ganador, Ronda Activa</li>
        </ul>
      </div>
    </div>
  );
};

export default TestGame;
