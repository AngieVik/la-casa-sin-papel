import React from 'react';
import { useStore } from '../store';
import { Shield, FileText, Zap, LogOut } from 'lucide-react';

const DashboardView: React.FC = () => {
  const isGM = useStore((state) => state.user.isGM);
  const setCurrentView = useStore((state) => state.setCurrentView);
  const setNickname = useStore((state) => state.setNickname);

  const handleLogout = () => {
      setNickname('');
      setCurrentView('login');
  };

  return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
        
        {/* Dashboard Header / Status */}
        <section className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                    {isGM ? 'Centro de Mando' : 'Refugio'}
                </h1>
                <p className="text-neutral-400 text-sm font-mono mt-1">
                    {isGM ? 'Control Operativo' : 'Zona Segura'}
                </p>
            </div>
            <button 
                onClick={handleLogout}
                className="p-2 text-neutral-500 hover:text-red-400 transition-colors rounded-lg border border-transparent hover:border-red-900/30 hover:bg-red-950/10"
                title="Cerrar Sesión"
            >
                <LogOut size={20} />
            </button>
        </section>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stats Card */}
            <div className="bg-neutral-800/50 border border-neutral-700 p-5 rounded-xl hover:border-green-500/50 transition-colors cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-neutral-400 text-xs font-mono uppercase">Estado de Misión</span>
                    <Shield className="text-green-500 group-hover:text-green-400" size={20} />
                </div>
                <div className="text-2xl font-bold text-white">Activo</div>
                <div className="text-xs text-neutral-500 mt-1">Fase 2: Infiltración</div>
            </div>

            {/* Resources Card */}
            <div className="bg-neutral-800/50 border border-neutral-700 p-5 rounded-xl hover:border-yellow-500/50 transition-colors cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-neutral-400 text-xs font-mono uppercase">Recursos</span>
                    <Zap className="text-yellow-500 group-hover:text-yellow-400" size={20} />
                </div>
                <div className="text-2xl font-bold text-white">85%</div>
                <div className="text-xs text-neutral-500 mt-1">Munición y Suministros</div>
            </div>
        </div>

        {/* Content Area based on User Type */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 relative overflow-hidden min-h-[400px]">
             {/* Decorative Background Element */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-green-500/5 rounded-full blur-3xl"></div>

            <div className="relative z-10">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-neutral-400" />
                    {isGM ? 'Notas del Director' : 'Inventario Personal'}
                </h2>
                
                {isGM ? (
                    <div className="space-y-2">
                        <p className="text-neutral-400 text-sm">Vista optimizada para Tablet activada.</p>
                        {/* GM Tabs */}
                        <div className="flex border-b border-neutral-700 mt-4 overflow-x-auto no-scrollbar">
                            <button className="px-4 py-2 text-green-400 border-b-2 border-green-400 font-medium text-sm whitespace-nowrap">Escenas</button>
                            <button className="px-4 py-2 text-neutral-500 hover:text-neutral-300 font-medium text-sm whitespace-nowrap">NPCs</button>
                            <button className="px-4 py-2 text-neutral-500 hover:text-neutral-300 font-medium text-sm whitespace-nowrap">Música</button>
                            <button className="px-4 py-2 text-neutral-500 hover:text-neutral-300 font-medium text-sm whitespace-nowrap">Tiradas</button>
                        </div>
                        <div className="py-4 text-neutral-500 text-sm">
                            <div className="p-4 border border-dashed border-neutral-800 rounded bg-neutral-900/50 text-center">
                                Selecciona una escena para comenzar...
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                         <div className="flex items-center justify-between p-3 bg-neutral-800 rounded border border-neutral-700 group hover:border-green-500/30 transition-colors">
                            <span className="text-sm font-medium group-hover:text-green-400 transition-colors">Máscara de Dalí</span>
                            <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded border border-green-900/50">Equipado</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-neutral-800 rounded border border-neutral-700 group hover:border-yellow-500/30 transition-colors">
                            <span className="text-sm font-medium group-hover:text-yellow-400 transition-colors">Radio de Corto Alcance</span>
                            <span className="text-xs text-neutral-500">Batería: 40%</span>
                        </div>
                         <div className="flex items-center justify-between p-3 bg-neutral-800 rounded border border-neutral-700 group hover:border-red-500/30 transition-colors">
                            <span className="text-sm font-medium group-hover:text-red-400 transition-colors">M16 (Réplica)</span>
                            <span className="text-xs text-neutral-500">Munición: 2/30</span>
                        </div>
                    </div>
                )}
            </div>
        </section>

      </div>
  );
};

export default DashboardView;