import React, { useState } from "react";
import {
  Fingerprint,
  EyeOff,
  Eye,
  Plus,
  Volume2,
  Zap,
  Mic,
  Send,
  MessageCircle,
  UserX,
  Ban,
} from "lucide-react";
import ModalWrapper from "../ModalWrapper";
import { useStore } from "../../store";
import { Player } from "../../types";
import { SOUNDS } from "../../constants/sounds";

interface PlayerEditModalProps {
  player: Player;
  playerStates: string[];
  publicStates: string[];
  roles: string[];
  onClose: () => void;
  onKick: () => void;
  onExpel: () => void;
}

const PlayerEditModal: React.FC<PlayerEditModalProps> = ({
  player,
  playerStates,
  publicStates,
  roles,
  onClose,
  onKick,
  onExpel,
}) => {
  // Store actions
  const gmTogglePlayerState = useStore((state) => state.gmTogglePlayerState);
  const gmTogglePublicState = useStore((state) => state.gmTogglePublicState);
  const gmSendSound = useStore((state) => state.gmSendSound);
  const gmSendVibration = useStore((state) => state.gmSendVibration);
  const gmSendDivineVoice = useStore((state) => state.gmSendDivineVoice);
  const gmWhisper = useStore((state) => state.gmWhisper);
  const gmTogglePlayerRole = useStore((state) => state.gmTogglePlayerRole);

  // Local state for dropdowns and inputs
  const [showPlayerStateDropdown, setShowPlayerStateDropdown] = useState(false);
  const [showPublicStateDropdown, setShowPublicStateDropdown] = useState(false);
  const [showSoundDropdown, setShowSoundDropdown] = useState(false);
  const [showVibrationDropdown, setShowVibrationDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [divineVoiceText, setDivineVoiceText] = useState("");
  const [whisperText, setWhisperText] = useState("");

  const closeAllDropdowns = () => {
    setShowPlayerStateDropdown(false);
    setShowPublicStateDropdown(false);
    setShowSoundDropdown(false);
    setShowVibrationDropdown(false);
    setShowRoleDropdown(false);
  };

  const handleWhisper = async () => {
    if (whisperText.trim()) {
      await gmWhisper(player.id, whisperText);
      setWhisperText("");
    }
  };

  const handleDivineVoice = async () => {
    if (divineVoiceText.trim()) {
      await gmSendDivineVoice(player.id, divineVoiceText);
      setDivineVoiceText("");
    }
  };

  return (
    <ModalWrapper title={`${player.nickname}`} onClose={onClose}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Role Editing */}
        <div>
          <label className="text-xs text-neutral-500 uppercase mb-2 flex items-center gap-1">
            <Fingerprint size={12} /> Rol del Jugador
          </label>
          <div className="flex flex-wrap gap-1 min-h-[32px] p-2 bg-neutral-900 rounded-lg border border-neutral-700 mb-2">
            {(player.roles || []).length === 0 && (
              <span className="text-neutral-600 text-xs">Sin roles</span>
            )}
            {(player.roles || []).map((role) => (
              <button
                key={role}
                onClick={() => gmTogglePlayerRole(player.id, role)}
                className="px-2 py-1 bg-teal-900/30 text-teal-400 rounded text-xs hover:bg-red-900/30 hover:text-red-400 transition-colors"
              >
                {role} ×
              </button>
            ))}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                closeAllDropdowns();
                setShowRoleDropdown(!showRoleDropdown);
              }}
              className="w-full p-2 bg-teal-900/20 text-teal-400 border border-teal-900/50 rounded-lg text-sm hover:bg-teal-900/40 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={14} /> Gestionar Roles
            </button>
            {showRoleDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-20 max-h-40 overflow-y-auto">
                {roles.map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      gmTogglePlayerRole(player.id, role);
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full p-2 text-left text-sm transition-colors ${
                      (player.roles || []).includes(role)
                        ? "bg-teal-900/40 text-teal-400"
                        : "text-neutral-300 hover:bg-teal-900/30 hover:text-teal-400"
                    }`}
                  >
                    {role} {(player.roles || []).includes(role) && "✓"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Current States Display */}
        <div>
          <label className="text-xs text-neutral-500 uppercase mb-2 flex items-center gap-1">
            <EyeOff size={12} /> Estados Privados (click para quitar)
          </label>
          <div className="flex flex-wrap gap-1 min-h-[32px] p-2 bg-neutral-900 rounded-lg border border-neutral-700">
            {(player.playerStates || []).length === 0 && (
              <span className="text-neutral-600 text-xs">Sin estados</span>
            )}
            {(player.playerStates || []).map((state) => (
              <button
                key={state}
                onClick={() => gmTogglePlayerState(player.id, state)}
                className="px-2 py-1 bg-purple-900/30 text-purple-400 rounded text-xs hover:bg-red-900/30 hover:text-red-400 transition-colors"
              >
                {state} ×
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-neutral-500 uppercase mb-2 flex items-center gap-1">
            <Eye size={12} /> Estados Públicos (click para quitar)
          </label>
          <div className="flex flex-wrap gap-1 min-h-[32px] p-2 bg-neutral-900 rounded-lg border border-neutral-700">
            {(player.publicStates || []).length === 0 && (
              <span className="text-neutral-600 text-xs">Sin estados</span>
            )}
            {(player.publicStates || []).map((state) => (
              <button
                key={state}
                onClick={() => gmTogglePublicState(player.id, state)}
                className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-xs hover:bg-red-900/30 hover:text-red-400 transition-colors"
              >
                {state} ×
              </button>
            ))}
          </div>
        </div>

        {/* Dropdowns Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Add Player State Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                closeAllDropdowns();
                setShowPlayerStateDropdown(!showPlayerStateDropdown);
              }}
              className="w-full p-2 bg-purple-900/20 text-purple-400 border border-purple-900/50 rounded-lg text-sm hover:bg-purple-900/40 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={14} /> Añadir estado
            </button>
            {showPlayerStateDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-20 max-h-40 overflow-y-auto">
                {playerStates.map((state) => (
                  <button
                    key={state}
                    onClick={() => {
                      gmTogglePlayerState(player.id, state);
                      setShowPlayerStateDropdown(false);
                    }}
                    className="w-full p-2 text-left text-sm text-neutral-300 hover:bg-purple-900/30 hover:text-purple-400 transition-colors"
                  >
                    {state}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add Public State Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                closeAllDropdowns();
                setShowPublicStateDropdown(!showPublicStateDropdown);
              }}
              className="w-full p-2 bg-blue-900/20 text-blue-400 border border-blue-900/50 rounded-lg text-sm hover:bg-blue-900/40 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={14} /> Añadir público
            </button>
            {showPublicStateDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-20 max-h-40 overflow-y-auto">
                {publicStates.map((state) => (
                  <button
                    key={state}
                    onClick={() => {
                      gmTogglePublicState(player.id, state);
                      setShowPublicStateDropdown(false);
                    }}
                    className="w-full p-2 text-left text-sm text-neutral-300 hover:bg-blue-900/30 hover:text-blue-400 transition-colors"
                  >
                    {state}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sound Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                closeAllDropdowns();
                setShowSoundDropdown(!showSoundDropdown);
              }}
              className="w-full p-2 bg-pink-900/20 text-pink-400 border border-pink-900/50 rounded-lg text-sm hover:bg-pink-900/40 transition-colors flex items-center justify-center gap-2"
            >
              <Volume2 size={14} /> Sonidos
            </button>
            {showSoundDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                {SOUNDS.map((sound) => (
                  <button
                    key={sound.id}
                    onClick={() => {
                      gmSendSound(player.id, sound.id);
                      setShowSoundDropdown(false);
                    }}
                    className="w-full p-2 text-left text-sm text-neutral-300 hover:bg-pink-900/30 hover:text-pink-400 transition-colors"
                  >
                    {sound.emoji} {sound.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vibration Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                closeAllDropdowns();
                setShowVibrationDropdown(!showVibrationDropdown);
              }}
              className="w-full p-2 bg-orange-900/20 text-orange-400 border border-orange-900/50 rounded-lg text-sm hover:bg-orange-900/40 transition-colors flex items-center justify-center gap-2"
            >
              <Zap size={14} /> Vibración
            </button>
            {showVibrationDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-20">
                <button
                  onClick={() => {
                    gmSendVibration(player.id, 10);
                    setShowVibrationDropdown(false);
                  }}
                  className="w-full p-2 text-left text-sm text-neutral-300 hover:bg-orange-900/30 hover:text-orange-400 transition-colors"
                >
                  Débil (10ms)
                </button>
                <button
                  onClick={() => {
                    gmSendVibration(player.id, 100);
                    setShowVibrationDropdown(false);
                  }}
                  className="w-full p-2 text-left text-sm text-neutral-300 hover:bg-orange-900/30 hover:text-orange-400 transition-colors"
                >
                  Media (100ms)
                </button>
                <button
                  onClick={() => {
                    gmSendVibration(player.id, 200);
                    setShowVibrationDropdown(false);
                  }}
                  className="w-full p-2 text-left text-sm text-neutral-300 hover:bg-orange-900/30 hover:text-orange-400 transition-colors"
                >
                  Fuerte (200ms)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Divine Voice */}
        <div className="border-t border-neutral-800 pt-4">
          <label className="text-xs text-neutral-500 uppercase mb-1 flex items-center gap-1">
            <Mic size={12} /> Voz Divina (Solo este player)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={divineVoiceText}
              onChange={(e) => setDivineVoiceText(e.target.value)}
              placeholder="Mensaje divino..."
              className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm"
            />
            <button
              onClick={handleDivineVoice}
              className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Whisper */}
        <div className="border-t border-neutral-800 pt-4">
          <label className="text-xs text-neutral-500 uppercase mb-1 flex items-center gap-1">
            <MessageCircle size={12} /> Whisper (Mensaje Privado Chat)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={whisperText}
              onChange={(e) => setWhisperText(e.target.value)}
              placeholder="Mensaje privado..."
              className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm"
            />
            <button
              onClick={handleWhisper}
              className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-neutral-800 pt-4 grid grid-cols-2 gap-2">
          <button
            onClick={onKick}
            className="flex items-center justify-center gap-2 p-3 bg-yellow-900/20 text-yellow-500 border border-yellow-900/50 rounded-lg hover:bg-yellow-900 hover:text-white text-sm transition-colors"
          >
            <UserX size={16} /> Kick (→ Patio)
          </button>
          <button
            onClick={onExpel}
            className="flex items-center justify-center gap-2 p-3 bg-red-900/20 text-red-500 border border-red-900/50 rounded-lg hover:bg-red-900 hover:text-white text-sm transition-colors"
          >
            <Ban size={16} /> Expulsar
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default PlayerEditModal;
