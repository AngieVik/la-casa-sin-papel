import React, { useState, useRef, useEffect } from 'react';
import { Send, Delete } from 'lucide-react';
import { useTimerStore } from '../store/useTimerStore';

const ClockConfigInput: React.FC = () => {
  const { setSeconds, isRunning } = useTimerStore();
  
  // We keep the input as a string of 4 digits (MMSS)
  const [digits, setDigits] = useState<string[]>(['0', '0', '0', '0']);
  const [activeIndex, setActiveIndex] = useState<number>(0); // 0-3
  const inputRef = useRef<HTMLInputElement>(null);

  const handleContainerClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // We only care about the last character entered if it's a number
    const lastChar = val.slice(-1);
    
    if (lastChar && /[0-9]/.test(lastChar)) {
      const newDigits = [...digits];
      
      // Overwrite logic: Replace the digit at the current active index (simulated cursor)
      // Since we want to fill it sequentially like a form, or push left?
      // The prompt says: "sobreescribir al escribir encima". 
      // Let's assume a cycle: If I have 00:00 and type 1, it becomes 10:00? No, that's weird for time.
      // Standard behavior for specific fields: You fill slots.
      // Slot 0 (M1), Slot 1 (M2), Slot 2 (S1), Slot 3 (S2).
      
      // Let's implement a Shift-Left approach (Calculator style) as it's the most robust for "no cursor movement needed" interaction, 
      // BUT prompt says "overwrite".
      
      // Let's try direct index mapping based on length of input, but input is hidden.
      // Let's use a simpler approach: A hidden input holds the raw string.
      
      // REVISED LOGIC: "Overwrite from left to right"
      if (activeIndex < 4) {
        newDigits[activeIndex] = lastChar;
        setDigits(newDigits);
        setActiveIndex(prev => Math.min(prev + 1, 3)); // Advance cursor, cap at end
      } else {
        // If at end, maybe overwrite the last one? 
        newDigits[3] = lastChar;
        setDigits(newDigits);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault(); // Prevent deleting the colon conceptually
      const newDigits = [...digits];
      // If we are at an index, clear it and move back
      // Logic: Move back one step, set to 0
      if (activeIndex > 0) {
        // Check if we are "at" a number or empty. 
        // Simple backspace: Go back one index, set to 0.
        const targetIndex = activeIndex === 4 ? 3 : Math.max(0, activeIndex - 1);
        newDigits[targetIndex] = '0';
        setDigits(newDigits);
        setActiveIndex(targetIndex);
      } else {
        newDigits[0] = '0';
        setDigits(newDigits);
      }
    }
  };

  // Allow clicking specific digits to set cursor
  const handleDigitClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex(index);
    inputRef.current?.focus();
  };

  const handleSubmit = () => {
    const minutes = parseInt(digits[0] + digits[1], 10);
    const seconds = parseInt(digits[2] + digits[3], 10);
    const total = (minutes * 60) + seconds;
    setSeconds(total);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl w-full max-w-sm mx-auto">
      <h2 className="text-zinc-500 text-xs font-bold tracking-widest mb-4 uppercase">Configuración de Tiempo</h2>
      
      {/* Visual Clock Container */}
      <div 
        className="relative bg-black rounded-xl p-6 border-2 border-zinc-800 cursor-text group hover:border-zinc-700 transition-colors"
        onClick={handleContainerClick}
      >
        {/* Hidden Input for capturing mobile keyboard */}
        <input
          ref={inputRef}
          type="tel"
          className="absolute inset-0 w-full h-full opacity-0 cursor-text pointer-events-none"
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          value="" // Always empty, we manage state manually
          autoComplete="off"
        />

        {/* Display Digits */}
        <div className="flex items-center justify-center text-6xl font-mono font-bold text-white tracking-widest">
          {digits.map((digit, index) => (
             <React.Fragment key={index}>
               <span 
                 onClick={(e) => handleDigitClick(index, e)}
                 className={`relative py-2 px-1 rounded transition-colors ${
                   activeIndex === index ? 'bg-primary/20 text-white animate-pulse' : 'text-zinc-300'
                 }`}
               >
                 {digit}
                 {/* Cursor indicator line at bottom if active */}
                 {activeIndex === index && (
                   <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-full"></div>
                 )}
               </span>
               {index === 1 && <span className="pb-2 text-zinc-600 px-1">:</span>}
             </React.Fragment>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isRunning}
        className={`mt-6 w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold uppercase tracking-wider transition-all transform active:scale-95 ${
          isRunning 
            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
            : 'bg-white text-black hover:bg-zinc-200'
        }`}
      >
        <Send size={20} />
        <span>Actualizar Reloj</span>
      </button>
      
      {isRunning && <p className="mt-2 text-xs text-red-500">Pausa el reloj para configurar</p>}
    </div>
  );
};

export default ClockConfigInput;
