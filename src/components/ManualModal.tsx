import React from "react";
import { X, BookOpen, Info } from "lucide-react";

interface ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameTitle: string;
}

const ManualModal: React.FC<ManualModalProps> = ({
  isOpen,
  onClose,
  gameTitle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-900/30 rounded border border-blue-500/50">
              <BookOpen size={18} className="text-blue-500" />
            </div>
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">
              Manual: {gameTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar font-mono text-sm text-neutral-300">
          <div className="flex items-start gap-3 p-3 bg-blue-950/20 border border-blue-900/30 rounded-lg text-blue-400">
            <Info size={18} className="shrink-0 mt-0.5" />
            <p>
              Este es un protocolo operativo estándar para la misión "
              {gameTitle}". Lea atentamente antes de proceder.
            </p>
          </div>

          <div className="space-y-4">
            <section>
              <h4 className="text-white font-bold mb-2 uppercase tracking-tight border-b border-neutral-800 pb-1">
                Objetivo
              </h4>
              <p>
                Infiltrarse en el perímetro y neutralizar las amenazas siguiendo
                las órdenes del Director.
              </p>
            </section>

            <section>
              <h4 className="text-white font-bold mb-2 uppercase tracking-tight border-b border-neutral-800 pb-1">
                Reglas de Compromiso
              </h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Mantenga silencio de radio a menos que sea necesario.</li>
                <li>Siga las fases temporales marcadas por el reloj global.</li>
                <li>
                  Coordine con sus compañeros mediante el canal encriptado.
                </li>
              </ul>
            </section>

            <section>
              <h4 className="text-white font-bold mb-2 uppercase tracking-tight border-b border-neutral-800 pb-1">
                Notas Tácticas
              </h4>
              <p>
                Cada rol tiene habilidades únicas. Asegúrese de conocer su
                identidad antes de que comience el operativo físico.
              </p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 text-center">
          <button
            onClick={onClose}
            className="px-8 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold uppercase tracking-wider transition-colors text-xs"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualModal;
