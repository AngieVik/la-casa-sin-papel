import React, { useEffect } from "react";
import { useStore } from "../store";
import ChatModal from "./ChatModal";
import {
  MessageCircle,
  Clock,
  RefreshCw,
  LogOut,
  UserPen,
  ShieldAlert,
} from "lucide-react";
import ModalWrapper from "./ModalWrapper";
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
  const setActiveChannel = useStore((state) => state.setActiveChannel);

  // Calculate clock time locally
  const timeString = useGameClock(clockConfig);

  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [newNickname, setNewNickname] = React.useState(nickname);
  const [isEditingNickname, setIsEditingNickname] = React.useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

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
      {/* HEADER: 2 Filas */}
      <header className="sticky top-0 z-40 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 shadow-lg">
        {/* Fila 1: Info Principal */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                isSync ? "bg-green-500 animate-pulse" : "bg-red-500"
              }`}
            />
            <div className="flex items-center gap-2 text-2xl font-mono font-bold tracking-widest text-red-600">
              <Clock className="w-5 h-5" />
              <span>{timeString}</span>
            </div>
          </div>
          <button
            onClick={() => setIsUserMenuOpen(true)}
            className="font-bold text-neutral-300 truncate max-w-[150px] hover:text-red-500 transition-colors cursor-pointer"
          >
            {nickname || "Anónimo"}
          </button>
        </div>

        {/* Fila 2: Ticker (Marquesina) */}
        <div className="bg-red-900/20 border-t border-red-900/30 overflow-hidden h-8 flex items-center">
          <style>
            {`
              @keyframes marquee {
                0% { transform: translateX(100%); }
                100% { transform: translateX(-100%); }
              }
              .animate-marquee {
                animation: marquee linear infinite;
              }
            `}
          </style>
          <div
            className="animate-marquee whitespace-nowrap text-xs font-mono text-red-400 px-4 uppercase tracking-widest"
            style={{
              animationDuration: `${tickerSpeed}s`,
            }}
          >
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

      {/* Chat Privado con GM (Solo para jugadores) */}
      {!isGM && (
        <button
          onClick={() => {
            setActiveChannel(`private_${userId}`);
            toggleChat();
          }}
          className="fixed bottom-6 right-24 w-10 h-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-50 ring-2 ring-neutral-900"
          title="Chat Privado con GM"
        >
          <ShieldAlert className="w-5 h-5" />
        </button>
      )}

      {/* MODALES */}
      {isChatOpen && <ChatModal />}

      {isUserMenuOpen && (
        <ModalWrapper
          title="Menú de Usuario"
          onClose={() => {
            setIsUserMenuOpen(false);
            setIsEditingNickname(false);
          }}
        >
          <div className="space-y-4">
            {/* Nickname Edit Section */}
            <div className="bg-neutral-800/50 p-4 rounded-lg border border-neutral-700">
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
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex-1 transition-colors"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setIsEditingNickname(false)}
                      className="bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex-1 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">
                    Nickname actual:
                  </span>
                  <span className="font-bold text-white">{nickname}</span>
                </div>
              )}
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-1 gap-3">
              {!isEditingNickname && (
                <button
                  onClick={() => setIsEditingNickname(true)}
                  className="flex items-center gap-3 w-full p-4 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-all group"
                >
                  <UserPen className="text-red-500 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Cambiar Nickname</span>
                </button>
              )}

              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-3 w-full p-4 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-all group"
              >
                <RefreshCw className="text-red-500 group-hover:rotate-180 transition-transform duration-500" />
                <span className="font-medium">Refrescar Sistema</span>
              </button>

              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  setShowLogoutConfirm(true);
                }}
                className="flex items-center gap-3 w-full p-4 bg-red-900/20 hover:bg-red-900/40 border border-red-900/30 rounded-xl transition-all group"
              >
                <LogOut className="text-red-500 group-hover:translate-x-1 transition-transform" />
                <span className="font-medium text-red-500">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirm && (
        <ModalWrapper
          title="Confirmación"
          onClose={() => setShowLogoutConfirm(false)}
        >
          <div className="space-y-6">
            <p className="text-neutral-300 text-center text-lg">
              ¿Seguro que quieres desconectarte?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCurrentView("login");
                  setShowLogoutConfirm(false);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
              >
                Sí, salir
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white px-6 py-3 rounded-lg font-bold transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
};

export default MainLayout;
