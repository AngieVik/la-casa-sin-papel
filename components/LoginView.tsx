import React, { useState } from 'react';
import { User, Lock, ArrowRight, ShieldAlert, Terminal, Loader2 } from 'lucide-react';
import { useStore } from '../store';

const LoginView: React.FC = () => {
  const [localNick, setLocalNick] = useState('');
  const [isGMMode, setIsGMMode] = useState(false);
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  // Store
  const loginToFirebase = useStore((state) => state.loginToFirebase);
  const isLoading = useStore((state) => state.ui.isLoading);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!localNick.trim()) {
      setLocalError('Identificación requerida.');
      return;
    }

    if (isGMMode) {
      if (password === '1010') {
        await loginToFirebase(localNick, true);
      } else {
        setLocalError('Código de acceso denegado.');
        return;
      }
    } else {
      await loginToFirebase(localNick, false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-md mx-auto px-4">
      
      {/* Logo / Brand */}
      <div className="mb-10 text-center animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="inline-flex items-center justify-center p-4 bg-red-600 rounded-full mb-4 shadow-[0_0_20px_rgba(220,38,38,0.5)]">
            <Terminal size={40} className="text-white" />
        </div>
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
          La Casa <span className="text-red-500">Sin Papel</span>
        </h1>
        <p className="text-neutral-400 text-sm font-mono mt-2 tracking-widest uppercase">
          Sistema de Gestión Táctica
        </p>
      </div>

      {/* Login Card */}
      <form onSubmit={handleLogin} className="w-full bg-neutral-900/50 border border-neutral-800 p-8 rounded-2xl backdrop-blur-sm shadow-2xl relative overflow-hidden group">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50"></div>
        
        <div className="space-y-6 relative z-10">
            
            {/* Nickname Input */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">Alias Operativo</label>
                <div className="relative group/input">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within/input:text-green-500 transition-colors" size={20} />
                    <input 
                        type="text" 
                        value={localNick}
                        onChange={(e) => setLocalNick(e.target.value)}
                        placeholder="Introduce tu alias..."
                        disabled={isLoading}
                        className="w-full bg-neutral-950 border border-neutral-700 text-white pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder:text-neutral-700 font-mono"
                    />
                </div>
            </div>

            {/* GM Toggle */}
            <div className="flex items-center justify-between py-2">
                <label className="flex items-center space-x-3 cursor-pointer group/check">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isGMMode ? 'bg-red-600 border-red-600' : 'border-neutral-600 bg-neutral-800'}`}>
                        {isGMMode && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <input 
                        type="checkbox" 
                        checked={isGMMode}
                        onChange={(e) => setIsGMMode(e.target.checked)}
                        disabled={isLoading}
                        className="hidden"
                    />
                    <span className={`text-sm font-medium transition-colors ${isGMMode ? 'text-red-400' : 'text-neutral-400 group-hover/check:text-neutral-300'}`}>
                        Acceso Director (GM)
                    </span>
                </label>
            </div>

            {/* Password Input (Conditional) */}
            {isGMMode && (
                 <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
                    <label className="text-xs font-bold text-red-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                        <ShieldAlert size={12} /> Código de Seguridad
                    </label>
                    <div className="relative group/input">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500/50 group-focus-within/input:text-red-500 transition-colors" size={20} />
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••"
                            maxLength={4}
                            disabled={isLoading}
                            className="w-full bg-neutral-950 border border-red-900/30 text-red-100 pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-red-900/20 font-mono tracking-widest"
                        />
                    </div>
                </div>
            )}

            {/* Error Message */}
            {localError && (
                <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-sm flex items-center justify-center gap-2 animate-pulse">
                    <ShieldAlert size={16} />
                    {localError}
                </div>
            )}

            {/* Submit Button */}
            <button 
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-lg
                    ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
                    ${isGMMode 
                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20' 
                        : 'bg-green-600 hover:bg-green-500 text-neutral-950 shadow-green-900/20'
                    }`}
            >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} /> Conectando...
                  </>
                ) : (
                  <>
                    {isGMMode ? 'Autenticar' : 'Ingresar'} <ArrowRight size={20} />
                  </>
                )}
            </button>
        </div>
      </form>
    </div>
  );
};

export default LoginView;