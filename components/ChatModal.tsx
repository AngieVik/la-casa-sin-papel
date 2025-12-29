import React, { useEffect, useRef } from 'react';
import { X, Send, ShieldCheck, User } from 'lucide-react';
import { useStore } from '../store';

const MOCK_MESSAGES = [
  { id: 1, user: 'Tokio', text: '¿Quién tiene el explosivo?', time: '10:02', role: 'player' },
  { id: 2, user: 'Profesor', text: 'Mantened la calma. Seguid el plan.', time: '10:03', role: 'gm' },
  { id: 3, user: 'Rio', text: 'El sistema de seguridad está reiniciándose...', time: '10:04', role: 'player' },
];

const ChatModal: React.FC = () => {
  const isChatOpen = useStore((state) => state.ui.isChatOpen);
  const toggleChat = useStore((state) => state.toggleChat);
  const nickname = useStore((state) => state.user.nickname);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isChatOpen]);

  if (!isChatOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-900/90 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/80 shadow-md">
        <div className="flex items-center gap-2">
            <div className="p-1 bg-green-900/30 rounded border border-green-500/50">
                <ShieldCheck size={18} className="text-green-500" />
            </div>
            <div>
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">Canal Encriptado</h3>
                <span className="text-xs text-green-500 font-mono animate-pulse">● Conexión Segura</span>
            </div>
        </div>
        <button 
            onClick={toggleChat}
            className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
        >
            <X size={24} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="text-center py-4">
            <span className="text-xs font-mono text-neutral-600 uppercase border-b border-neutral-800 pb-1">Inicio de sesión registrado</span>
        </div>
        
        {MOCK_MESSAGES.map((msg) => {
            const isMe = msg.user === nickname; // In a real app check ID
            return (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'gm' ? 'items-center' : 'items-start'}`}>
                    {msg.role === 'gm' && (
                         <div className="w-full text-center my-2">
                             <span className="bg-red-900/20 text-red-500 text-xs font-bold px-2 py-0.5 rounded border border-red-900/50 uppercase tracking-widest">
                                Mensaje del Director
                             </span>
                         </div>
                    )}
                    <div className={`max-w-[85%] rounded-2xl p-3 border ${
                        msg.role === 'gm' 
                        ? 'bg-red-950/30 border-red-900/50 text-red-100 self-center w-full text-center' 
                        : 'bg-neutral-800 border-neutral-700 text-neutral-200'
                    }`}>
                        <div className="flex justify-between items-baseline mb-1 gap-4">
                            <span className={`text-xs font-bold ${msg.role === 'gm' ? 'text-red-400' : 'text-green-400'}`}>
                                {msg.user}
                            </span>
                            <span className="text-[10px] text-neutral-500 font-mono">{msg.time}</span>
                        </div>
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                </div>
            );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-neutral-950 border-t border-neutral-800">
        <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <input 
                type="text" 
                placeholder="Transmitir mensaje..." 
                autoFocus
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
  );
};

export default ChatModal;