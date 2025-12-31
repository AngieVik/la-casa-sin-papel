import { useState, useEffect, useRef } from "react";

interface ClockConfig {
  mode: "static" | "countdown" | "stopwatch";
  baseTime: number; // Tiempo acumulado en segundos
  isRunning: boolean;
  startTime: number | null; // Timestamp de inicio (null si pausado)
}

/**
 * Hook para calcular el tiempo del reloj en tiempo real sin actualizar Firebase.
 * Funciona como un reloj de tablero deportivo: calcula localmente basándose en timestamps.
 */
export function useGameClock(config: ClockConfig): string {
  // Safe defaults
  const safeConfig = config || {
    mode: "static" as const,
    baseTime: 0,
    isRunning: false,
    startTime: null,
  };

  const [displayTime, setDisplayTime] = useState(() =>
    calculateDisplayTime(safeConfig)
  );

  // Use ref to access latest config in interval without re-creating it
  const configRef = useRef(safeConfig);
  configRef.current = safeConfig;

  useEffect(() => {
    // Calculate immediately on config change
    setDisplayTime(calculateDisplayTime(safeConfig));

    // If not running, no need for interval
    if (!safeConfig.isRunning || safeConfig.startTime === null) {
      return;
    }

    // Update every second while running
    const interval = setInterval(() => {
      setDisplayTime(calculateDisplayTime(configRef.current));
    }, 1000);

    return () => clearInterval(interval);
  }, [
    safeConfig.mode,
    safeConfig.baseTime,
    safeConfig.isRunning,
    safeConfig.startTime,
  ]);

  return displayTime;
}

/**
 * Calcula el tiempo a mostrar basado en la configuración actual
 */
function calculateDisplayTime(config: ClockConfig): string {
  const { mode, baseTime, isRunning, startTime } = config;

  // Protección contra NaN
  const safeBaseTime = isNaN(baseTime) ? 0 : baseTime;

  // Modo estático o pausado: mostrar baseTime directamente
  if (mode === "static" || !isRunning || startTime === null) {
    return formatTime(safeBaseTime);
  }

  // Calcular tiempo transcurrido desde startTime
  const elapsedSeconds = (Date.now() - startTime) / 1000;

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
 * Formatea segundos a formato "MM:SS"
 */
function formatTime(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return "00:00";

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
  if (isNaN(totalSeconds)) return "00:00";

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}
