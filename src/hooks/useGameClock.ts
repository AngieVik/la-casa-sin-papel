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
  const [currentTime, setCurrentTime] = useState(() => calculateTime(config));

  useEffect(() => {
    // Si el reloj está pausado o es estático, no necesitamos intervalo
    if (config.mode === "static" || config.startTime === null) {
      setCurrentTime(calculateTime(config));
      return;
    }

    // Actualizar cada segundo para countdown y stopwatch activos
    const interval = setInterval(() => {
      setCurrentTime(calculateTime(config));
    }, 1000);

    return () => clearInterval(interval);
  }, [config]);

  return currentTime;
}

/**
 * Calcula el tiempo actual basado en la configuración
 */
function calculateTime(config: ClockConfig): string {
  const { mode, baseTime, startTime, pausedAt } = config;

  // Modo estático: simplemente muestra baseTime
  if (mode === "static") {
    return formatTime(baseTime);
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

  if (mode === "countdown") {
    // Cuenta atrás: baseTime - tiempo transcurrido (mínimo 0)
    const remaining = Math.max(0, baseTime - elapsedSeconds);
    return formatTime(Math.floor(remaining));
  }

  if (mode === "stopwatch") {
    // Cronómetro: baseTime + tiempo transcurrido
    const accumulated = baseTime + elapsedSeconds;
    return formatTime(Math.floor(accumulated));
  }

  return formatTime(baseTime);
}

/**
 * Formatea segundos a formato "MM:SS" para mostrar tiempo del juego
 */
function formatTime(totalSeconds: number): string {
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
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}
