import React from "react";
import { MessageSquare, Clock, User, X } from "lucide-react";
import { useStore } from "../store";
import ChatModal from "./ChatModal";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // Extracting specific state slices for performance
  const gameClock = useStore((state) => state.room.gameClock);
  const nickname = useStore((state) => state.user.nickname);
  const tickerText = useStore((state) => state.room.tickerText);
  const isChatOpen = useStore((state) => state.ui.isChatOpen);
  const toggleChat = useStore((state) => state.toggleChat);
  const subscribeToRoom = useStore((state) => state.subscribeToRoom);

  // Initialize Realtime DB Listeners once
  React.useEffect(() => {
    subscribeToRoom();
  }, [subscribeToRoom]);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-900 text-white font-sans overflow-hidden">
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-40 bg-neutral-950 border-b border-neutral-800 shadow-lg">
        {/* Row 1: Clock & Nickname */}
        <div className="flex justify-between items-center px-4 py-3 h-14">
          <div className="flex items-center space-x-2 text-green-400">
            <Clock size={18} />
            <span className="font-mono text-xl font-bold tracking-wider">
              {gameClock}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-neutral-300">
            <span className="font-medium text-sm uppercase tracking-wide">
              {nickname || "Invitado"}
            </span>
            <div className="p-1.5 bg-neutral-800 rounded-full border border-neutral-700">
              <User size={16} />
            </div>
          </div>
        </div>

        {/* Row 2: Ticker (Marquee) */}
        <div className="relative h-8 bg-neutral-900/90 border-t border-neutral-800 flex items-center overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-neutral-900 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-neutral-900 to-transparent z-10 pointer-events-none"></div>

          <div className="w-full whitespace-nowrap overflow-hidden">
            <div className="animate-marquee inline-block text-xs font-mono text-yellow-500/90 tracking-widest uppercase">
              {tickerText}
            </div>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 relative overflow-y-auto no-scrollbar p-4 md:p-6 pb-24">
        {children}
      </main>

      {/* --- CHAT FAB --- */}
      {/* Only show FAB if chat is closed, otherwise the Modal handles closing */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-2xl transition-all duration-300 ease-in-out
          ${
            isChatOpen
              ? "opacity-0 pointer-events-none scale-0"
              : "bg-green-600 hover:bg-green-500 hover:scale-105 opacity-100 scale-100"
          }`}
        aria-label="Open Chat"
      >
        <MessageSquare size={24} className="text-white" />
      </button>

      {/* --- CHAT MODAL --- */}
      <ChatModal />
    </div>
  );
};

export default MainLayout;
