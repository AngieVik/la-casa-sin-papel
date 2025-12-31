import { useState, useEffect } from "react";

interface ClockConfig {
  mode: "static" | "countdown" | "stopwatch";
  baseTime: number; // Tiempo base en segundos
  startTime: number | null; // Timestamp de cuando se dio a play
  pausedAt: number | null; // Timestamp de cuando se pausó
}

/**
 * Hook para calcular el tiempo del reloj en tiempo real sin actualizar Firebase constantemente.
 * Funciona como un reloj de tablero deportivo.
 */
export function useGameClock(config: ClockConfig): string {
  // Asegurarse de que config nunca es undefined para evitar crash inicial
  const safeConfig = config || {
    mode: "static",
    baseTime: 0,
    startTime: null,
    pausedAt: null,
  };

  const [currentTime, setCurrentTime] = useState(() =>
    calculateTime(safeConfig)
  );

  useEffect(() => {
    // Si el reloj está pausado o es estático, no necesitamos intervalo
    if (safeConfig.mode === "static" || safeConfig.startTime === null) {
      setCurrentTime(calculateTime(safeConfig));
      return;
    }

    // Actualizar cada segundo para countdown y stopwatch activos
    const interval = setInterval(() => {
      setCurrentTime(calculateTime(safeConfig));
    }, 1000);

    return () => clearInterval(interval);
  }, [safeConfig]);

  return currentTime;
}

/**
 * Calcula el tiempo actual basado en la configuración
 */
function calculateTime(config: ClockConfig): string {
  const { mode, baseTime, startTime, pausedAt } = config;

  // Protección contra NaN en baseTime
  const safeBaseTime = isNaN(baseTime) ? 0 : baseTime;

  // Modo estático: simplemente muestra baseTime
  if (mode === "static") {
    return formatTime(safeBaseTime);
  }

  // Calcular tiempo transcurrido
  let elapsedSeconds = 0;

  if (startTime !== null) {
    if (pausedAt !== null) {
      // Está pausado: usar el tiempo hasta la pausa
      elapsedSeconds = (pausedAt - startTime) / 1000;
    } else {
      // Está corriendo: calcular desde startTime hasta ahora
      elapsedSeconds = (Date.now() - startTime) / 1000;
    }
  }

  // Protección contra NaN en elapsedSeconds
  if (isNaN(elapsedSeconds)) elapsedSeconds = 0;

  if (mode === "countdown") {
    // Cuenta atrás: baseTime - tiempo transcurrido (mínimo 0)
    const remaining = Math.max(0, safeBaseTime - elapsedSeconds);
    return formatTime(Math.floor(remaining));
  }

  if (mode === "stopwatch") {
    // Cronómetro: baseTime + tiempo transcurrido
    const accumulated = safeBaseTime + elapsedSeconds;
    return formatTime(Math.floor(accumulated));
  }

  return formatTime(safeBaseTime);
}

/**
 * Formatea segundos a formato "MM:SS" para mostrar tiempo del juego
 */
function formatTime(totalSeconds: number): string {
  if (isNaN(totalSeconds)) return "00:00"; // Fallback final

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

/**
 * Formatea segundos a formato "MM:SS" para input de texto
 */
export function formatTimeToMMSS(totalSeconds: number): string {
  if (isNaN(totalSeconds)) return "00:00"; // Fallback final

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}
