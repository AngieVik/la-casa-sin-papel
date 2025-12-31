import React, { useEffect } from 'react';
import Header from './components/Header';
import ClockConfigInput from './components/ClockConfigInput';
import ModeControl from './components/ModeControl';
import ChatFab from './components/ChatFab';
import { useTimerStore } from './store/useTimerStore';

const App: React.FC = () => {
  const { tick } = useTimerStore();

  useEffect(() => {
    const interval = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  return (
    <div className="min-h-screen bg-background text-zinc-100 font-sans pb-24">
      <Header />
      
      <main className="pt-32 px-4 container mx-auto max-w-2xl flex flex-col items-center">
        <div className="w-full animate-fade-in-up">
          <ClockConfigInput />
          <ModeControl />
        </div>
      </main>

      <ChatFab />

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
