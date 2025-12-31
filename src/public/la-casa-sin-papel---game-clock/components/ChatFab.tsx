import React, { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

const ChatFab: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary rounded-full shadow-lg shadow-red-900/50 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform z-40"
      >
        <MessageSquare size={24} />
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Drawer Content */}
          <div className="relative w-full max-w-md bg-zinc-900 h-full shadow-2xl flex flex-col border-l border-zinc-800 animate-slide-in">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h3 className="font-bold text-lg text-white">Comunicaciones</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <div className="bg-zinc-800 p-3 rounded-lg rounded-tl-none self-start max-w-[80%]">
                <p className="text-sm text-zinc-300">Equipo, atención al reloj. Sincronización en 3...</p>
                <span className="text-[10px] text-zinc-500 block mt-1">Profesor - 10:42</span>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-900">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Escribir mensaje..."
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
                />
                <button className="p-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700">
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatFab;
