import { useState, useEffect } from "react";

interface ClockConfig {
  mode: "static" | "countdown" | "stopwatch";
  startTime: number | null;
  pausedAt: number | null;
  duration: number;
}

/**
 * Hook para calcular el tiempo del reloj en tiempo real sin actualizar Firebase constantemente.
 * Solo Firebase guarda la configuración, el cálculo se hace localmente.
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
  const { mode, startTime, pausedAt, duration } = config;

  // Modo estático: simplemente muestra duration
  if (mode === "static") {
    return formatTime(duration);
  }

  // Si está pausado (startTime es null pero pausedAt existe), mostrar tiempo congelado
  if (startTime === null && pausedAt !== null) {
    return formatTime(duration);
  }

  // Si no ha iniciado aún
  if (startTime === null) {
    return formatTime(duration);
  }

  // Calcular tiempo transcurrido desde que empezó
  const now = Date.now();
  const elapsedSeconds = (now - startTime) / 1000;

  if (mode === "countdown") {
    // Tiempo restante = duration - tiempo transcurrido
    const remaining = Math.max(0, duration - elapsedSeconds);
    return formatTime(Math.floor(remaining));
  }

  if (mode === "stopwatch") {
    // Tiempo acumulado = duration + tiempo transcurrido
    const accumulated = duration + elapsedSeconds;
    return formatTime(Math.floor(accumulated));
  }

  return formatTime(duration);
}

/**
 * Formatea segundos a formato "MM:SS"
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
 * Formatea segundos a formato "HH:MM" para input type="time"
 */
export function formatTimeToHHMM(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
}
