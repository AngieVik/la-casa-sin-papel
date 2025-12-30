import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Send,
  ShieldCheck,
  Globe,
  Users,
  Lock,
  MessageSquare,
} from "lucide-react";
import { useStore } from "../store";

type TabType = "global" | "grupo" | "privado";

const ChatModal: React.FC = () => {
  const isChatOpen = useStore((state) => state.ui.isChatOpen);
  const toggleChat = useStore((state) => state.toggleChat);
  const nickname = useStore((state) => state.user.nickname);
  const userId = useStore((state) => state.user.id);
  const isGM = useStore((state) => state.user.isGM);
  const channels = useStore((state) => state.room.channels);
  const sendChatMessage = useStore((state) => state.sendChatMessage);
  const setActiveChannel = useStore((state) => state.setActiveChannel);
  const activeChannel = useStore((state) => state.ui.activeChannel);
  const players = useStore((state) => state.room.players);

  const [activeTab, setActiveTab] = useState<TabType>("global");
  const [messageText, setMessageText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Get GM player for private chat
  const gmPlayer = players.find((p) => p.isGM);

  // Determine channel based on tab
  const getChannelName = (): string => {
    switch (activeTab) {
      case "global":
        return "global";
      case "grupo":
        return "room_lobby";
      case "privado":
        return isGM ? `private_${userId}` : `private_${userId}`;
      default:
        return "global";
    }
  };

  const currentMessages = channels[getChannelName()] || [];

  useEffect(() => {
    if (isChatOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isChatOpen, currentMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    await sendChatMessage(messageText, getChannelName());
    setMessageText("");
  };

  if (!isChatOpen) return null;

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "global", label: "GLOBAL", icon: <Globe size={14} /> },
    { id: "grupo", label: "GRUPO", icon: <Users size={14} /> },
    { id: "privado", label: "PRIVADO", icon: <Lock size={14} /> },
  ];

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
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-green-900/30 rounded border border-green-500/50">
              <ShieldCheck size={18} className="text-green-500" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                Canal Encriptado
              </h3>
              <span className="text-xs text-green-500 font-mono animate-pulse">
                ● Conexión Segura
              </span>
            </div>
          </div>
          <button
            onClick={toggleChat}
            className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-neutral-950 border-b border-neutral-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab.id
                  ? "text-red-500 border-b-2 border-red-500 bg-neutral-900"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-center py-4">
            <span className="text-xs font-mono text-neutral-600 uppercase border-b border-neutral-800 pb-1">
              {activeTab === "global" && "Canal Global Activo"}
              {activeTab === "grupo" && "Canal de Grupo"}
              {activeTab === "privado" && "Canal Privado con GM"}
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
                        <span className="bg-red-900/20 text-red-500 text-xs font-bold px-2 py-0.5 rounded border border-red-900/50 uppercase tracking-widest">
                          Mensaje del Director
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
          <form className="flex gap-2" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Transmitir mensaje..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
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
    </div>
  );
};

export default ChatModal;
