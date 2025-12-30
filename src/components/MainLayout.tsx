import React, { useEffect } from "react";
import { useStore } from "../store";
import ChatModal from "./ChatModal";
import { MessageCircle, Clock, Radio } from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // Selectores optimizados para evitar re-renders innecesarios
  const subscribeToRoom = useStore((state) => state.subscribeToRoom);
  const toggleChat = useStore((state) => state.toggleChat);
  const nickname = useStore((state) => state.user.nickname);
  const gameClock = useStore((state) => state.room.gameClock);
  const tickerText = useStore((state) => state.room.tickerText);
  const isChatOpen = useStore((state) => state.ui.isChatOpen);
  const isSync = useStore((state) => state.ui.isSync);

  // Sincronización única al montar el componente
  useEffect(() => {
    subscribeToRoom();
  }, [subscribeToRoom]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-red-900 selection:text-white pb-20 md:pb-0">
      {/* HEADER: 2 Filas */}
      <header className="sticky top-0 z-40 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 shadow-lg">
        {/* Fila 1: Info Principal */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full ${
                isSync ? "bg-green-500 animate-pulse" : "bg-red-500"
              }`}
            />
            <div className="flex items-center gap-2 text-2xl font-mono font-bold tracking-widest text-red-600">
              <Clock className="w-5 h-5" />
              <span>{gameClock}</span>
            </div>
          </div>
          <div className="font-bold text-neutral-300 truncate max-w-[150px]">
            {nickname || "Anónimo"}
          </div>
        </div>

        {/* Fila 2: Ticker (Marquesina) */}
        <div className="bg-red-900/20 border-t border-red-900/30 overflow-hidden h-8 flex items-center">
          <div className="whitespace-nowrap animate-marquee text-xs font-mono text-red-400 px-4 uppercase tracking-widest">
            {tickerText}
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="p-4 max-w-5xl mx-auto animate-in fade-in duration-500">
        {children}
      </main>

      {/* CHAT FAB (Botón Flotante) */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-50 ring-4 ring-neutral-900"
      >
        <MessageCircle className="w-7 h-7" />
      </button>

      {/* MODALES */}
      {isChatOpen && <ChatModal />}
    </div>
  );
};

export default MainLayout;
