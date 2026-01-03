import React, { useState, useEffect } from "react";
import { useStore } from "../store";
import { formatTimeToMMSS } from "../hooks/useGameClock";

export type TabID = "control" | "narrative" | "actions";

export const useGMInterface = () => {
  const [activeTab, setActiveTab] = useState<TabID>("control");

  // Store data
  const tickerText = useStore((state) => state.room.tickerText);
  const clockConfig = useStore((state) => state.room.clockConfig);
  const tickerSpeed = useStore((state) => state.room.tickerSpeed);
  const status = useStore((state) => state.room.status);
  const players = useStore((state) => state.room.players);
  const votes = useStore((state) => state.room.votes);
  const globalStates = useStore((state) => state.room.globalStates);
  const playerStates = useStore((state) => state.room.playerStates);
  const publicStates = useStore((state) => state.room.publicStates);
  const roles = useStore((state) => state.room.roles);
  const gameSelected = useStore((state) => state.room.gameSelected);
  const currentGlobalState = useStore((state) => state.room.globalState);

  // Store actions
  const gmUpdateTicker = useStore((state) => state.gmUpdateTicker);
  const gmSelectGame = useStore((state) => state.gmSelectGame);
  const gmStartGame = useStore((state) => state.gmStartGame);
  const gmEndGame = useStore((state) => state.gmEndGame);
  const gmTurnOffSession = useStore((state) => state.gmTurnOffSession);
  const gmSetStaticTime = useStore((state) => state.gmSetStaticTime);
  const gmKickPlayer = useStore((state) => state.gmKickPlayer);
  const gmRemovePlayer = useStore((state) => state.gmRemovePlayer);
  const gmResetRoom = useStore((state) => state.gmResetRoom);
  const setCurrentView = useStore((state) => state.setCurrentView);
  const setNickname = useStore((state) => state.setNickname);
  const setGM = useStore((state) => state.setGM);
  const gmSendDivineVoice = useStore((state) => state.gmSendDivineVoice);
  const gmSendGlobalMessage = useStore((state) => state.gmSendGlobalMessage);

  // Local state
  const [localTicker, setLocalTicker] = useState(tickerText);
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);

  // Confirmation Modals State
  const [showShutdownConfirm, setShowShutdownConfirm] = useState(false);
  const [showEndSessionConfirm, setShowEndSessionConfirm] = useState(false);
  const [showStartGameConfirm, setShowStartGameConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showExpelConfirm, setShowExpelConfirm] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Global actions modal state
  const [showGlobalMessageModal, setShowGlobalMessageModal] = useState(false);
  const [globalMessageText, setGlobalMessageText] = useState("");
  const [showGlobalDivineVoiceModal, setShowGlobalDivineVoiceModal] =
    useState(false);
  const [globalDivineVoiceText, setGlobalDivineVoiceText] = useState("");

  // State card editing (passed to StateManagementModals)
  const [editingState, setEditingState] = useState<{
    type: "global" | "player" | "public" | "role";
    value: string;
  } | null>(null);
  const [newStateName, setNewStateName] = useState("");
  const [addingStateType, setAddingStateType] = useState<
    "global" | "player" | "public" | "role" | null
  >(null);
  const [assigningState, setAssigningState] = useState<{
    type: "player" | "public" | "role";
    value: string;
  } | null>(null);
  const [deleteStateConfirm, setDeleteStateConfirm] = useState<{
    type: "global" | "player" | "public" | "role";
    value: string;
  } | null>(null);

  // GM Toast for action confirmations
  const [gmToast, setGmToast] = useState<string | null>(null);

  // Clock buffer state
  const [localTime, setLocalTime] = useState(
    formatTimeToMMSS(clockConfig.baseTime)
  );
  const [isEditingClock, setIsEditingClock] = useState(false);

  // Sync local time with baseTime when not editing (Static Config View)
  useEffect(() => {
    if (!isEditingClock) {
      setLocalTime(formatTimeToMMSS(clockConfig.baseTime));
    }
  }, [clockConfig.baseTime, isEditingClock]);

  // Manejador del input de tiempo BLINDADO
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Eliminar cualquier cosa que no sea número
    let raw = e.target.value.replace(/\D/g, "");

    // 2. Limitar a 4 dígitos (MMSS)
    if (raw.length > 4) raw = raw.slice(0, 4);

    // 3. Formatear visualmente
    let formatted = raw;
    if (raw.length >= 3) {
      formatted = raw.slice(0, 2) + ":" + raw.slice(2);
    }

    setLocalTime(formatted);
  };

  const handleClockBlur = () => {
    setIsEditingClock(false);
    // Al salir, enviamos lo que haya. La función del store lo saneará si faltan ceros.
    gmSetStaticTime(localTime);
  };

  const handleEndSession = async () => {
    // Apagar / Turn Off Session Logic
    await gmTurnOffSession();
    setNickname("");
    setGM(false);
    setCurrentView("login");
    setShowEndSessionConfirm(false);
  };

  // Toast helper for GM action confirmations
  const showGmToastMsg = (msg: string) => {
    setGmToast(msg);
    setTimeout(() => setGmToast(null), 2500);
  };

  const handleTickerUpdate = () => {
    gmUpdateTicker(localTicker);
  };

  const handleStartGame = () => {
    const sortedGames = Object.entries(votes).sort(
      (a, b) => Object.keys(b[1] || {}).length - Object.keys(a[1] || {}).length
    );
    const winner = sortedGames.length > 0 ? sortedGames[0][0] : "g1";
    gmStartGame(winner);
    setShowStartGameConfirm(false);
  };

  const openPlayerEdit = (playerId: string) => {
    setEditingPlayer(playerId);
  };

  const editingPlayerData = editingPlayer
    ? players.find((p) => p.id === editingPlayer)
    : null;

  // Handlers for global message/voice
  const handleSendGlobalMessage = async () => {
    if (globalMessageText.trim()) {
      await gmSendGlobalMessage(globalMessageText);
      showGmToastMsg(
        `📢 Mensaje global enviado a ${
          players.filter((p) => !p.isGM).length
        } jugadores`
      );
      setGlobalMessageText("");
      setShowGlobalMessageModal(false);
    }
  };

  const handleSendDivineVoice = async () => {
    if (globalDivineVoiceText.trim()) {
      await gmSendDivineVoice(null, globalDivineVoiceText);
      setGlobalDivineVoiceText("");
      setShowGlobalDivineVoiceModal(false);
    }
  };

  const handleShutdown = async () => {
    await gmResetRoom();
    setShowShutdownConfirm(false);
  };

  const handleExpelPlayer = async () => {
    if (editingPlayer) {
      await gmRemovePlayer(editingPlayer);
      setEditingPlayer(null);
    }
    setShowExpelConfirm(false);
  };

  const handleSoftReset = async () => {
    await gmEndGame();
    setShowResetConfirm(false);
  };

  const handleKickPlayer = async () => {
    if (editingPlayer) {
      await gmKickPlayer(editingPlayer);
      setEditingPlayer(null);
    }
  };

  return {
    // State
    activeTab,
    setActiveTab,
    tickerText,
    localTicker,
    setLocalTicker,
    clockConfig,
    tickerSpeed,
    status,
    players,
    votes,
    globalStates,
    playerStates,
    publicStates,
    roles,
    gameSelected,
    currentGlobalState,

    // Modal Visibility
    showShutdownConfirm,
    setShowShutdownConfirm,
    showEndSessionConfirm,
    setShowEndSessionConfirm,
    showStartGameConfirm,
    setShowStartGameConfirm,
    showResetConfirm,
    setShowResetConfirm,
    showExpelConfirm,
    setShowExpelConfirm,
    showAuditModal,
    setShowAuditModal,
    showGlobalMessageModal,
    setShowGlobalMessageModal,
    showGlobalDivineVoiceModal,
    setShowGlobalDivineVoiceModal,

    // Modal Inputs
    globalMessageText,
    setGlobalMessageText,
    globalDivineVoiceText,
    setGlobalDivineVoiceText,

    // State Management Logic
    editingState,
    setEditingState,
    newStateName,
    setNewStateName,
    addingStateType,
    setAddingStateType,
    assigningState,
    setAssigningState,
    deleteStateConfirm,
    setDeleteStateConfirm,

    // Editing Player
    editingPlayer,
    setEditingPlayer,
    editingPlayerData,
    openPlayerEdit,

    // Clock
    localTime,
    isEditingClock,
    setIsEditingClock,
    handleTimeChange,
    handleClockBlur,

    // Actions & Handlers
    gmSelectGame,
    gmEndGame,
    handleEndSession,
    handleTickerUpdate,
    handleStartGame,
    handleSendGlobalMessage,
    handleSendDivineVoice,
    handleShutdown,
    handleExpelPlayer,
    handleSoftReset,
    handleKickPlayer,
    gmRemovePlayer,

    // Misc
    gmToast,
    showGmToastMsg,
  };
};
