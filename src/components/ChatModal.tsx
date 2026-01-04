import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Send,
  ShieldCheck,
  Globe,
  Users,
  Lock,
  MessageSquare,
  Plus,
  Settings,
  Trash2,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { useStore } from "../store";

type TabType = "global" | "privado" | string; // string for room IDs

const ChatModal: React.FC = () => {
  // Store data
  const isChatOpen = useStore((state) => state.ui.isChatOpen);
  const toggleChat = useStore((state) => state.toggleChat);
  const nickname = useStore((state) => state.user.nickname);
  const userId = useStore((state) => state.user.id);
  const isGM = useStore((state) => state.user.isGM);
  const channels = useStore((state) => state.room.channels);
  const chatRooms = useStore((state) => state.room.chatRooms);
  const players = useStore((state) => state.room.players);
  const sendChatMessage = useStore((state) => state.sendChatMessage);
  const typing = useStore((state) => state.room.typing);
  const setTyping = useStore((state) => state.setTyping);

  // Chat room actions
  const gmCreateChatRoom = useStore((state) => state.gmCreateChatRoom);
  const gmAddPlayerToRoom = useStore((state) => state.gmAddPlayerToRoom);
  const gmRemovePlayerFromRoom = useStore(
    (state) => state.gmRemovePlayerFromRoom
  );
  const gmCloseChatRoom = useStore((state) => state.gmCloseChatRoom);
  const gmWhisper = useStore((state) => state.gmWhisper);
  const activeTab = useStore((state) => state.ui.activeTab);
  const setActiveTab = useStore((state) => state.setActiveChannel);
  const unreadTabs = useStore((state) => state.ui.unreadTabs);

  // Local state
  const [messageText, setMessageText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create room modal state
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

  // Room settings modal state
  const [managingRoom, setManagingRoom] = useState<string | null>(null);

  // Close room confirmation
  const [closeRoomConfirm, setCloseRoomConfirm] = useState<string | null>(null);

  // GM: Selected player for quick edit from chat
  const [selectedPlayerForEdit, setSelectedPlayerForEdit] = useState<
    string | null
  >(null);
  const [whisperText, setWhisperText] = useState("");

  // Filter rooms visible to current user
  const visibleRooms = chatRooms.filter(
    (room) => isGM || (userId && room.playerIds.includes(userId))
  );

  // Get channel name based on active tab
  const getChannelName = (): string => {
    if (activeTab === "global") return "global";
    if (activeTab === "privado") return `private_${userId}`;
    // For room tabs, use room_ prefix
    return `room_${activeTab}`;
  };

  // For GM on privado tab, aggregate ALL private channels
  const getMessagesForTab = () => {
    if (activeTab === "privado" && isGM) {
      // Collect all private_* channels
      const allPrivateMessages: (typeof channels)[string] = [];
      Object.entries(channels).forEach(([channelName, messages]) => {
        if (channelName.startsWith("private_")) {
          allPrivateMessages.push(...messages);
        }
      });
      return allPrivateMessages;
    }
    return channels[getChannelName()] || [];
  };

  const currentMessages = getMessagesForTab();

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isChatOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isChatOpen, currentMessages]);

  // Reset to global tab if current room was closed
  useEffect(() => {
    if (
      activeTab !== "global" &&
      activeTab !== "privado" &&
      !visibleRooms.find((r) => r.id === activeTab)
    ) {
      setActiveTab("global");
    }
  }, [visibleRooms, activeTab]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    await sendChatMessage(messageText, getChannelName());
    setMessageText("");
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim() || selectedPlayerIds.length === 0) return;

    await gmCreateChatRoom(newRoomName, selectedPlayerIds);
    setNewRoomName("");
    setSelectedPlayerIds([]);
    setShowCreateRoomModal(false);
  };

  const togglePlayerSelection = (playerId: string) => {
    if (selectedPlayerIds.includes(playerId)) {
      setSelectedPlayerIds(selectedPlayerIds.filter((id) => id !== playerId));
    } else {
      setSelectedPlayerIds([...selectedPlayerIds, playerId]);
    }
  };

  if (!isChatOpen) return null;

  // Get current room data for managing
  const currentManagedRoom = managingRoom
    ? chatRooms.find((r) => r.id === managingRoom)
    : null;

  // Build dynamic tabs
  const baseTabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "global", label: "GLOBAL", icon: <Globe size={14} /> },
    { id: "privado", label: "PRIVADO", icon: <Lock size={14} /> },
  ];

  const roomTabs = visibleRooms.map((room) => ({
    id: room.id,
    label: room.name.toUpperCase(),
    icon: <Users size={14} />,
  }));

  const allTabs = [...baseTabs, ...roomTabs];

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm -z-10"
        style={{ height: "100vh", bottom: 0 }}
        onClick={toggleChat}
      />

      {/* Chat Container */}
      <div
        className="bg-neutral-900 border-t border-neutral-800 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
        style={{ height: "85vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-1 border-b rounded-t-3xl border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="p-1 ml-4 bg-green-900/30 rounded border border-green-500/50">
              <ShieldCheck size={18} className="text-green-500" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm tracking-wider">
                Canal Encriptado
              </h3>
              <span className="text-[10px] text-green-500 font-mono animate-pulse whitespace-nowrap mt-0.5">
                ● Conexión Segura
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleChat}
              className="p-1 mr-4 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Tabs - Scrollable with Create Room Button */}
        <div className="flex items-center bg-neutral-950 border-b border-neutral-800 px-2">
          <div className="flex-1 flex overflow-x-auto no-scrollbar">
            {allTabs.map((tab) => {
              const hasUnread = unreadTabs.includes(tab.id);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center p-1 gap-1 ml-2 text-xs font-bold tracking-wider transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "text-red-500 border-b-2 border-red-500 bg-neutral-900"
                      : hasUnread
                      ? "text-yellow-400 bg-yellow-900/20 animate-chat-notify"
                      : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {/* GM: Settings button for room tabs */}
                  {isGM &&
                    tab.id !== "global" &&
                    tab.id !== "privado" &&
                    activeTab === tab.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setManagingRoom(tab.id);
                        }}
                        className="ml-1 p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-white"
                      >
                        <Settings size={12} />
                      </button>
                    )}
                </button>
              );
            })}
          </div>

          {/* GM: Create Room Button moved to tabs line */}
          {isGM && (
            <button
              onClick={() => setShowCreateRoomModal(true)}
              className="ml-2 p-1 m-1 aspect-[5/1] rounded bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-400 border border-indigo-500/30 transition-all flex items-center justify-center"
              title="Crear Sala"
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-center py-4">
            <span className="text-xs font-mono text-neutral-600 uppercase border-b border-neutral-800 pb-1">
              {activeTab === "global" && "Canal Global Activo"}
              {activeTab === "privado" && "Canal Privado con GM"}
              {activeTab !== "global" &&
                activeTab !== "privado" &&
                `Sala: ${
                  visibleRooms.find((r) => r.id === activeTab)?.name ||
                  activeTab
                }`}
            </span>
          </div>

          {currentMessages.length === 0 ? (
            <div className="text-center py-12 text-neutral-600 font-mono text-sm">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
              Sin mensajes en este canal
            </div>
          ) : (
            currentMessages
              .sort((a, b) => a.timestamp - b.timestamp)
              .map((msg) => {
                const isMe = msg.user === nickname;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.role === "gm"
                        ? "items-center"
                        : isMe
                        ? "items-end"
                        : "items-start"
                    }`}
                  >
                    {msg.role === "gm" && (
                      <div className="w-full text-center my-2">
                        <span className="hidden bg-red-900/20 text-red-500 text-xs font-bold px-2 py-0.5 rounded border border-red-900/50 tracking-widest">
                          Mensaje del GameMaster
                        </span>
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 border ${
                        msg.role === "gm"
                          ? "bg-red-950/30 border-red-900/50 text-red-100 self-center w-full text-center"
                          : isMe
                          ? "bg-green-900/20 border-green-900/50 text-green-100"
                          : "bg-neutral-800 border-neutral-700 text-neutral-200"
                      }`}
                    >
                      <div className="flex justify-between items-baseline mb-1 gap-4">
                        {/* Nickname - clickable for GM in private tab */}
                        {isGM &&
                        activeTab === "privado" &&
                        msg.role !== "gm" ? (
                          <button
                            onClick={() => {
                              // Find player by nickname and open edit
                              const player = players.find(
                                (p) => p.nickname === msg.user
                              );
                              if (player) setSelectedPlayerForEdit(player.id);
                            }}
                            className={`text-xs font-bold cursor-pointer hover:underline ${
                              isMe ? "text-green-400" : "text-blue-400"
                            }`}
                          >
                            {msg.user} 💬
                          </button>
                        ) : (
                          <span
                            className={`text-xs font-bold ${
                              msg.role === "gm"
                                ? "text-red-400"
                                : isMe
                                ? "text-green-400"
                                : "text-blue-400"
                            }`}
                          >
                            {msg.user}
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {new Date(msg.timestamp).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                );
              })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800">
          {/* Typing Indicator */}
          {(() => {
            const channelName = getChannelName();
            const channelTyping = typing[channelName] || {};
            const typingUsers = Object.entries(channelTyping)
              .filter(
                ([uid, timestamp]) =>
                  uid !== userId && Date.now() - timestamp < 5000
              )
              .map(
                ([uid]) =>
                  players.find((p) => p.id === uid)?.nickname || "Alguien"
              );

            if (typingUsers.length === 0) return null;

            return (
              <div className="text-xs text-neutral-500 mb-2 flex items-center gap-1 animate-pulse">
                <span className="inline-flex">
                  <span
                    className="w-1 h-1 bg-neutral-500 rounded-full mx-0.5 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></span>
                  <span
                    className="w-1 h-1 bg-neutral-500 rounded-full mx-0.5 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></span>
                  <span
                    className="w-1 h-1 bg-neutral-500 rounded-full mx-0.5 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></span>
                </span>
                {typingUsers.length === 1
                  ? `${typingUsers[0]} está escribiendo...`
                  : `${typingUsers.join(", ")} están escribiendo...`}
              </div>
            );
          })()}

          <form className="flex gap-2" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Transmitir mensaje..."
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);

                // Debounced typing indicator (400ms)
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }

                if (e.target.value.trim()) {
                  setTyping(getChannelName(), true);
                  // Auto-clear typing after 3 seconds of inactivity
                  typingTimeoutRef.current = setTimeout(() => {
                    setTyping(getChannelName(), false);
                  }, 3000);
                } else {
                  setTyping(getChannelName(), false);
                }
              }}
              onBlur={() => {
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }
                setTyping(getChannelName(), false);
              }}
              className="flex-1 bg-neutral-900 text-white px-4 py-3 rounded-xl border border-neutral-700 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm font-mono placeholder:text-neutral-600 transition-all"
            />
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-500 text-white p-3 rounded-xl transition-colors shadow-lg shadow-green-900/20"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>

      {/* CREATE ROOM MODAL */}
      {showCreateRoomModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <h3 className="font-bold text-white uppercase tracking-wider">
                Crear Sala Privada
              </h3>
              <button
                onClick={() => {
                  setShowCreateRoomModal(false);
                  setNewRoomName("");
                  setSelectedPlayerIds([]);
                }}
                className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs text-neutral-500 mb-1">
                  Nombre de la Sala
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Ej: Operación Secreta"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-500 mb-2">
                  Seleccionar Jugadores
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {players
                    .filter((p) => !p.isGM)
                    .map((player) => (
                      <button
                        key={player.id}
                        onClick={() => togglePlayerSelection(player.id)}
                        className={`p-2 rounded-lg text-sm text-left transition-colors ${
                          selectedPlayerIds.includes(player.id)
                            ? "bg-indigo-600 text-white"
                            : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                        }`}
                      >
                        {player.nickname}
                      </button>
                    ))}
                </div>
                {players.filter((p) => !p.isGM).length === 0 && (
                  <p className="text-neutral-500 text-center py-4 text-sm">
                    No hay jugadores conectados
                  </p>
                )}
              </div>

              <button
                onClick={handleCreateRoom}
                disabled={!newRoomName.trim() || selectedPlayerIds.length === 0}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white py-2 rounded-lg font-bold transition-colors"
              >
                Crear Sala ({selectedPlayerIds.length} jugadores)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE ROOM MODAL */}
      {managingRoom && currentManagedRoom && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <h3 className="font-bold text-white uppercase tracking-wider">
                Gestionar: {currentManagedRoom.name}
              </h3>
              <button
                onClick={() => setManagingRoom(null)}
                className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Current Members */}
              <div>
                <label className="block text-xs text-neutral-500 uppercase mb-2">
                  Miembros Actuales
                </label>
                <div className="space-y-1">
                  {currentManagedRoom.playerIds.map((playerId) => {
                    const player = players.find((p) => p.id === playerId);
                    return (
                      <div
                        key={playerId}
                        className="flex items-center justify-between p-2 bg-neutral-800 rounded-lg"
                      >
                        <span className="text-white text-sm">
                          {player?.nickname || playerId}
                        </span>
                        <button
                          onClick={() =>
                            gmRemovePlayerFromRoom(managingRoom, playerId)
                          }
                          className="p-1 text-red-400 hover:bg-red-900/30 rounded"
                          title="Quitar de la sala"
                        >
                          <UserMinus size={16} />
                        </button>
                      </div>
                    );
                  })}
                  {currentManagedRoom.playerIds.length === 0 && (
                    <p className="text-neutral-500 text-center py-2 text-sm">
                      Sin miembros
                    </p>
                  )}
                </div>
              </div>

              {/* Add Player */}
              <div>
                <label className="block text-xs text-neutral-500 uppercase mb-2">
                  Añadir Jugador
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {players
                    .filter(
                      (p) =>
                        !p.isGM && !currentManagedRoom.playerIds.includes(p.id)
                    )
                    .map((player) => (
                      <button
                        key={player.id}
                        onClick={() =>
                          gmAddPlayerToRoom(managingRoom, player.id)
                        }
                        className="p-2 bg-neutral-800 hover:bg-indigo-600 text-neutral-300 hover:text-white rounded-lg text-sm transition-colors flex items-center gap-1"
                      >
                        <UserPlus size={14} />
                        {player.nickname}
                      </button>
                    ))}
                </div>
              </div>

              {/* Close Room */}
              {closeRoomConfirm === managingRoom ? (
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      await gmCloseChatRoom(managingRoom);
                      setManagingRoom(null);
                      setCloseRoomConfirm(null);
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg font-bold transition-colors"
                  >
                    Confirmar Cierre
                  </button>
                  <button
                    onClick={() => setCloseRoomConfirm(null)}
                    className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white py-2 rounded-lg font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCloseRoomConfirm(managingRoom)}
                  className="w-full bg-red-900/30 hover:bg-red-900 text-red-400 hover:text-white py-2 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} /> Cerrar Sala
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GM Quick Whisper Modal */}
      {selectedPlayerForEdit &&
        (() => {
          const player = players.find((p) => p.id === selectedPlayerForEdit);
          if (!player) return null;
          return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                  <h3 className="font-bold text-white uppercase tracking-wider">
                    Responder a: {player.nickname}
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedPlayerForEdit(null);
                      setWhisperText("");
                    }}
                    className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex gap-2 text-sm">
                    <span className="text-neutral-500">Rol:</span>
                    <span className="text-green-400">
                      {(player.roles || []).length > 0
                        ? player.roles?.join(", ")
                        : "Player"}
                    </span>
                  </div>
                  {(player.playerStates || []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(player.playerStates || []).map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 bg-purple-900/30 text-purple-400 text-xs rounded"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs text-neutral-500 uppercase mb-1">
                      Enviar Whisper
                    </label>
                    <input
                      type="text"
                      value={whisperText}
                      onChange={(e) => setWhisperText(e.target.value)}
                      placeholder="Mensaje privado para este jugador..."
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={async () => {
                      if (whisperText.trim()) {
                        await gmWhisper(selectedPlayerForEdit, whisperText);
                        setWhisperText("");
                        setSelectedPlayerForEdit(null);
                      }
                    }}
                    disabled={!whisperText.trim()}
                    className="w-full bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white py-2 rounded-lg font-bold transition-colors"
                  >
                    Enviar Whisper
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
};

export default ChatModal;
