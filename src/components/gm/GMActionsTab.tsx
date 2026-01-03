import React, { useState } from "react";
import {
  MessageSquare,
  Volume2,
  Zap,
  Mic,
  Type,
  Clock,
  Gauge,
  Play,
  Pause,
  Hourglass,
  Timer,
  Settings,
  PowerOff,
} from "lucide-react";
import { useStore } from "../../store";
import { SOUNDS } from "../../constants/sounds";
import { ClockConfig } from "../../types";

interface GMActionsTabProps {
  players: { id: string; isGM: boolean }[];
  tickerText: string;
  tickerSpeed: number;
  clockConfig: ClockConfig;
  localTime: string;
  isEditingClock: boolean;
  onShowGlobalMessageModal: () => void;
  onShowDivineVoiceModal: () => void;
  onShowShutdownConfirm: () => void;
  onTickerChange: (value: string) => void;
  onTickerUpdate: () => void;
  onTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClockFocus: () => void;
  onClockBlur: () => void;
  showGmToast: (msg: string) => void;
}

const GMActionsTab: React.FC<GMActionsTabProps> = ({
  players,
  tickerText,
  tickerSpeed,
  clockConfig,
  localTime,
  isEditingClock,
  onShowGlobalMessageModal,
  onShowDivineVoiceModal,
  onShowShutdownConfirm,
  onTickerChange,
  onTickerUpdate,
  onTimeChange,
  onClockFocus,
  onClockBlur,
  showGmToast,
}) => {
  const [showGlobalSoundDropdown, setShowGlobalSoundDropdown] = useState(false);
  const [showGlobalVibrationDropdown, setShowGlobalVibrationDropdown] =
    useState(false);

  const gmSendSound = useStore((s) => s.gmSendSound);
  const gmSendVibration = useStore((s) => s.gmSendVibration);
  const gmSetTickerSpeed = useStore((s) => s.gmSetTickerSpeed);
  const gmStartClock = useStore((s) => s.gmStartClock);
  const gmPauseClock = useStore((s) => s.gmPauseClock);

  const nonGMPlayerCount = players.filter((p) => !p.isGM).length;

  return (
    <div className="animate-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-4 gap-1">
        {/* Global Message Button */}
        <button
          onClick={onShowGlobalMessageModal}
          className="aspect-[2/1] bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-1 group hover:bg-neutral-800 hover:border-indigo-500 transition-all"
        >
          <div className="p-1 bg-indigo-500/10 rounded-full group-hover:bg-indigo-500 text-indigo-500 group-hover:text-white transition-colors">
            <MessageSquare size={32} />
          </div>
          <span className="font-bold text-neutral-300 group-hover:text-white">
            Mensaje Global
          </span>
        </button>

        {/* Sound Effect Button with Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowGlobalSoundDropdown(!showGlobalSoundDropdown);
              setShowGlobalVibrationDropdown(false);
            }}
            className="aspect-[2/1] w-full bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-1 group hover:bg-neutral-800 hover:border-pink-500 transition-all"
          >
            <div className="p-1 bg-pink-500/10 rounded-full group-hover:bg-pink-500 text-pink-500 group-hover:text-white transition-colors">
              <Volume2 size={32} />
            </div>
            <span className="font-bold text-neutral-300 group-hover:text-white">
              Efecto Sonido
            </span>
          </button>
          {showGlobalSoundDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
              {SOUNDS.map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => {
                    gmSendSound(null, sound.id);
                    showGmToast(
                      `✅ ${sound.emoji} ${sound.name} enviado a ${nonGMPlayerCount} jugadores`
                    );
                    setShowGlobalSoundDropdown(false);
                  }}
                  className="w-full p-2 text-left text-sm text-neutral-300 hover:bg-pink-900/30 hover:text-pink-400 transition-colors"
                >
                  {sound.emoji} {sound.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Vibration Button with Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowGlobalVibrationDropdown(!showGlobalVibrationDropdown);
              setShowGlobalSoundDropdown(false);
            }}
            className="aspect-[2/1] w-full bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-1 group hover:bg-neutral-800 hover:border-orange-500 transition-all"
          >
            <div className="p-1 bg-orange-500/10 rounded-full group-hover:bg-orange-500 text-orange-500 group-hover:text-white transition-colors">
              <Zap size={32} />
            </div>
            <span className="font-bold text-neutral-300 group-hover:text-white">
              Vibración
            </span>
          </button>
          {showGlobalVibrationDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-20">
              {[
                { label: "Débil", intensity: 10 },
                { label: "Media", intensity: 100 },
                { label: "Fuerte", intensity: 200 },
              ].map((option) => (
                <button
                  key={option.intensity}
                  onClick={() => {
                    gmSendVibration(null, option.intensity);
                    showGmToast(
                      `📳 Vibración ${option.label.toLowerCase()} enviada a ${nonGMPlayerCount} jugadores`
                    );
                    setShowGlobalVibrationDropdown(false);
                  }}
                  className="w-full p-2 text-left text-sm text-neutral-300 hover:bg-orange-900/30 hover:text-orange-400 transition-colors"
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divine Voice Button */}
        <button
          onClick={onShowDivineVoiceModal}
          className="aspect-[2/1] bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-1 group hover:bg-neutral-800 hover:border-blue-500 transition-all"
        >
          <div className="p-1 bg-blue-500/10 rounded-full group-hover:bg-blue-500 text-blue-500 group-hover:text-white transition-colors">
            <Mic size={32} />
          </div>
          <span className="font-bold text-neutral-300 group-hover:text-white">
            Voz Divina
          </span>
        </button>
      </div>

      {/* Ticker & Clock configuration */}
      <div className="mt-4 pt-4 border-t border-neutral-800 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Ticker Control */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
            <Type size={16} /> Mensaje del Ticker
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tickerText}
              onChange={(e) => onTickerChange(e.target.value)}
              className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-yellow-500 focus:outline-none transition-colors"
            />
            <button
              onClick={onTickerUpdate}
              className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold px-2 py-1 rounded-xl transition-colors"
            >
              Publicar
            </button>
          </div>

          {/* Ticker Speed Slider */}
          <div className="mt-4">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2 mb-2">
              <Gauge size={16} /> Velocidad del Ticker: {tickerSpeed}s
            </label>
            <input
              type="range"
              min="5"
              max="60"
              value={tickerSpeed}
              onChange={(e) => gmSetTickerSpeed(Number(e.target.value))}
              className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            <div className="flex justify-between text-[10px] text-neutral-600">
              <span>Rápido</span>
              <span>Lento</span>
            </div>
          </div>
        </div>

        {/* Reloj del Juego */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-neutral-500 tracking-wider flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
            <Clock size={16} /> Reloj del Juego
          </label>

          {/* INPUT EDITABLE BLINDADO */}
          <div className="bg-neutral-950 w-[150px] rounded-xl border border-neutral-800 animate-in slide-in-from-right-4 duration-300">
            <input
              type="text"
              placeholder="00:00"
              value={localTime}
              onChange={onTimeChange}
              onFocus={onClockFocus}
              onBlur={onClockBlur}
              className="text-3xl font-mono font-black text-green-500 bg-transparent text-center w-full focus:outline-none placeholder:text-green-900"
            />
          </div>

          {/* BOTONES DE CONTROL - Grid 2 columnas */}
          <div className="grid grid-cols-2 gap-1 animate-in slide-in-from-right-4 duration-300">
            {/* TARJETA CUENTA ATRÁS */}
            <button
              onClick={() => {
                if (clockConfig.mode === "countdown" && clockConfig.isRunning) {
                  gmPauseClock();
                } else {
                  gmStartClock("countdown");
                }
              }}
              className={`flex flex-row sm:flex-col items-center justify-center gap-2 p-2 rounded-xl border transition-all hover:scale-105 ${
                clockConfig.mode === "countdown" && clockConfig.isRunning
                  ? "bg-orange-900/30 border-orange-500 text-orange-400"
                  : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-orange-600"
              }`}
            >
              {/* Icono de modo y Texto (se mueve abajo en desktop, se queda a la izquierda en móvil) */}
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <Hourglass size={20} />
                <span className="hidden sm:inline font-bold text-sm">
                  Cuenta Atrás
                </span>
              </div>

              {/* Botón Play/Pause (se mueve arriba en desktop, se queda a la derecha en móvil) */}
              <div className="order-2 sm:order-1">
                {clockConfig.mode === "countdown" && clockConfig.isRunning ? (
                  <Pause size={25} className="text-orange-500" />
                ) : (
                  <Play
                    size={25}
                    fill="currentColor"
                    className="text-orange-500"
                  />
                )}
              </div>
            </button>

            {/* TARJETA CRONÓMETRO */}
            <button
              onClick={() => {
                if (clockConfig.mode === "stopwatch" && clockConfig.isRunning) {
                  gmPauseClock();
                } else {
                  gmStartClock("stopwatch");
                }
              }}
              className={`flex flex-row sm:flex-col items-center justify-center gap-2 p-2 rounded-xl border transition-all hover:scale-105 ${
                clockConfig.mode === "stopwatch" && clockConfig.isRunning
                  ? "bg-green-900/30 border-green-500 text-green-400"
                  : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-green-600"
              }`}
            >
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <Timer size={20} />
                <span className="hidden sm:inline font-bold text-sm">
                  Cronómetro
                </span>
              </div>

              <div className="order-2 sm:order-1">
                {clockConfig.mode === "stopwatch" && clockConfig.isRunning ? (
                  <Pause size={25} className="text-green-500" />
                ) : (
                  <Play
                    size={25}
                    fill="currentColor"
                    className="text-green-500"
                  />
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 animate-in slide-in-from-right-4 duration-300">
        <div className="mt-2 p-2 bg-red-950/20 border border-red-900/30 rounded-xl ">
          <h4 className="text-red-500 font-bold mb-4 flex items-center gap-2">
            <Settings size={16} /> Zona peligrosa
          </h4>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={onShowShutdownConfirm}
              className="p-1 bg-red-900/20 text-red-400 border border-red-900/50 rounded-lg hover:bg-red-900 hover:text-white text-sm transition-colors flex items-center gap-2"
            >
              <PowerOff size={16} /> SHUTDOWN{" "}
              <span className="hidden sm:inline">(Reset Total)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GMActionsTab;
