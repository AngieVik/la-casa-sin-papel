import React, { useEffect } from "react";
import { useStore } from "../store";
import ChatModal from "./ChatModal";
import { MessageCircle, Clock, RefreshCw, LogOut, UserPen } from "lucide-react";
import ModalWrapper from "./ModalWrapper";
import ConfirmModal from "./ConfirmModal";
import { ref, update as firebaseUpdate } from "firebase/database";
import { db } from "../firebaseConfig";
import { useGameClock } from "../hooks/useGameClock";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // Selectores optimizados para evitar re-renders innecesarios
  const subscribeToRoom = useStore((state) => state.subscribeToRoom);
  const toggleChat = useStore((state) => state.toggleChat);
  const nickname = useStore((state) => state.user.nickname);
  const clockConfig = useStore((state) => state.room.clockConfig);
  const tickerText = useStore((state) => state.room.tickerText);
  const isChatOpen = useStore((state) => state.ui.isChatOpen);
  const isSync = useStore((state) => state.ui.isSync);
  const setCurrentView = useStore((state) => state.setCurrentView);
  const userId = useStore((state) => state.user.id);
  const isGM = useStore((state) => state.user.isGM);
  const tickerSpeed = useStore((state) => state.room.tickerSpeed);
  const logoutPlayer = useStore((state) => state.logoutPlayer);
  const unreadTabs = useStore((state) => state.ui.unreadTabs);

  // Calculate clock time locally using the passive hook
  const timeString = useGameClock(clockConfig);

  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [newNickname, setNewNickname] = React.useState(nickname);
  const [isEditingNickname, setIsEditingNickname] = React.useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [showRefreshConfirm, setShowRefreshConfirm] = React.useState(false);

  // Sincronización única al montar el componente
  useEffect(() => {
    subscribeToRoom();
  }, [subscribeToRoom]);

  // Update lastSeen timestamp periodically and handle cleanup
  useEffect(() => {
    if (!userId) return;

    const playerRef = ref(db, `rooms/defaultRoom/players/${userId}`);

    // Update lastSeen every 30 seconds
    const heartbeat = setInterval(() => {
      firebaseUpdate(playerRef, { lastSeen: Date.now() });
    }, 30000);

    // Mark as offline when component unmounts or user leaves
    const handleBeforeUnload = () => {
      firebaseUpdate(playerRef, { status: "offline", lastSeen: Date.now() });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Mark as offline on cleanup
      firebaseUpdate(playerRef, { status: "offline", lastSeen: Date.now() });
    };
  }, [userId]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-red-900 selection:text-white pb-20 md:pb-0">
      {/* HEADER: Integrado */}
      {/* Definición de Animación en línea */}
      <header className="h-16 border-b border-neutral-800 bg-neutral-950 shadow-md sticky top-0 z-50">
        <div className="flex items-center justify-between h-full w-full px-4 overflow-hidden">
          {/* 1. IZQUIERDA: Reloj y Estado */}
          <div className="flex-shrink-0 flex items-center gap-4 pr-4 border-r border-neutral-800/50 h-10 my-auto z-20 bg-neutral-950">
            <div
              className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor] transition-colors duration-500 ${
                isSync
                  ? "bg-green-500 text-green-500"
                  : "bg-red-500 text-red-500"
              }`}
            />
            <div className="flex items-center gap-2 text-xl font-mono font-bold tracking-widest text-red-600">
              <Clock className="w-5 h-5" />
              <span>{timeString}</span>
            </div>
          </div>

          {/* 2. CENTRO: Ticker */}
          <div className="flex-1 relative h-full flex items-center overflow-hidden mx-4 min-w-0">
            {/* Degradados */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-neutral-950 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-neutral-950 to-transparent z-10 pointer-events-none" />

            {/* Texto animado */}
            <div
              className="animate-marquee-header whitespace-nowrap text-sm font-mono text-red-400/90 font-bold tracking-[0.2em]"
              style={{ animationDuration: `${tickerSpeed}s` }}
            >
              {tickerText}
            </div>
          </div>

          {/* 3. DERECHA: Usuario */}
          <div className="flex-shrink-0 flex items-center pl-4 border-l border-neutral-800/50 h-10 my-auto z-20 bg-neutral-950">
            <button
              onClick={() => setIsUserMenuOpen(true)}
              className="flex items-center gap-2 font-bold text-neutral-400 hover:text-white transition-colors text-sm max-w-[200px]"
            >
              <span className="truncate">{nickname || "DESCONOCIDO"}</span>
            </button>
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
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all z-50 ring-4 ring-neutral-900 ${
          unreadTabs.length > 0
            ? "bg-yellow-500 text-black scale-125 animate-chat-notify shadow-[0_0_20px_rgba(234,179,8,0.5)]"
            : "bg-red-600 hover:bg-red-700 text-white hover:scale-110 active:scale-95"
        }`}
      >
        <MessageCircle
          className={`w-7 h-7 ${unreadTabs.length > 0 ? "fill-current" : ""}`}
        />
      </button>

      {/* MODALES */}
      {isChatOpen && <ChatModal />}

      {isUserMenuOpen && (
        <ModalWrapper
          title="Opciones de usuario"
          onClose={() => {
            setIsUserMenuOpen(false);
            setIsEditingNickname(false);
          }}
        >
          <div className="space-y-2">
            {/* Nickname Edit Section */}
            <div className="bg-transparent p-2 text-3xl font-bold">
              {isEditingNickname ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    className="bg-neutral-900 border border-red-900 text-white p-2 rounded w-full focus:outline-none focus:ring-1 focus:ring-red-500"
                    placeholder="Nuevo Nickname"
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={async () => {
                        if (newNickname.trim() && userId) {
                          // Update Firebase
                          await firebaseUpdate(
                            ref(db, `rooms/defaultRoom/players/${userId}`),
                            {
                              nickname: newNickname.trim(),
                            }
                          );
                          // Update Zustand via local action if needed, or wait for sync
                          useStore.getState().setNickname(newNickname.trim());
                          setIsEditingNickname(false);
                        }
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-1 py-1 rounded-lg text-sm font-bold flex-1 transition-colors"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setIsEditingNickname(false)}
                      className="bg-neutral-700 hover:bg-neutral-600 text-white px-1 py-1 rounded-lg text-sm font-bold flex-1 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-start">
                  <span className="font-bold text-white gap-4">{nickname}</span>
                </div>
              )}
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-1 gap-4">
              {!isEditingNickname && (
                <button
                  onClick={() => setIsEditingNickname(true)}
                  className="flex items-center gap-4 p-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-all group"
                >
                  <UserPen className="text-red-500 group-hover:scale-150 transition-transform duration-500" />
                  <span className="font-medium">Cambiar Nickname</span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  setShowRefreshConfirm(true);
                }}
                className="flex items-center gap-4 p-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-all group"
              >
                <RefreshCw className="text-red-500 group-hover:rotate-180 transition-transform duration-500" />
                <span className="font-medium">Refrescar</span>
              </button>

              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  setShowLogoutConfirm(true);
                }}
                className="flex items-center gap-4 p-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-all group"
              >
                <LogOut className="text-red-500 group-hover:translate-x-2 transition-transform duration-500" />
                <span className="font-medium">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirm && (
        <ConfirmModal
          title="Cerrar Sesión"
          message="¿Seguro que quieres cerrar sesión? Tu sesión será eliminada de Firebase."
          confirmText="Sí, salir"
          cancelText="Mejor me quedo"
          variant="warning"
          onConfirm={async () => {
            await logoutPlayer();
            setShowLogoutConfirm(false);
          }}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}

      {/* REFRESH CONFIRMATION MODAL */}
      {showRefreshConfirm && (
        <ConfirmModal
          title="Refrescar Página"
          message="A veces ayuda, otras no tanto..."
          confirmText="Refrescar"
          cancelText="Cancelar"
          variant="info"
          onConfirm={() => window.location.reload()}
          onCancel={() => setShowRefreshConfirm(false)}
        />
      )}
    </div>
  );
};

export default MainLayout;
