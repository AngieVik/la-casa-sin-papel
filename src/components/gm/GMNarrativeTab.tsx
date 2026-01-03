import React from "react";
import {
  Globe,
  Eye,
  EyeOff,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Fingerprint,
} from "lucide-react";
import { useStore } from "../../store";

interface GMNarrativeTabProps {
  globalStates: string[];
  playerStates: string[];
  publicStates: string[];
  roles: string[];
  currentGlobalState: string;
  onAddState: (type: "global" | "player" | "public" | "role") => void;
  onEditState: (
    type: "global" | "player" | "public" | "role",
    value: string
  ) => void;
  onDeleteState: (
    type: "global" | "player" | "public" | "role",
    value: string
  ) => void;
  onAssignState: (type: "player" | "public", value: string) => void;
}

const GMNarrativeTab: React.FC<GMNarrativeTabProps> = ({
  globalStates,
  playerStates,
  publicStates,
  roles,
  currentGlobalState,
  onAddState,
  onEditState,
  onDeleteState,
  onAssignState,
}) => {
  const gmUpdateGlobalState = useStore((s) => s.gmUpdateGlobalState);

  // CLASE DEFINITIVA:
  // - pb-8 crea un "puente" invisible para que el ratón nunca deje de estar encima.
  // - visibility + transition-all hace que el botón sea clickable durante todo el delay.
  const actionButtonsClasses = `
    absolute -top-7 -right-1 flex gap-1 z-20 
    opacity-0 invisible pb-8 
    transition-all duration-300 delay-700 
    group-hover:opacity-100 group-hover:visible group-hover:delay-0
    hover:delay-0
  `;

  const renderStateGroup = (
    title: string,
    states: string[],
    type: "global" | "player" | "public" | "role",
    icon: React.ReactNode,
    colorClasses: {
      normal: string;
      active?: string;
    }
  ) => (
    <div className="space-y-4 md:col-span-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-neutral-500 tracking-wider uppercase flex items-center gap-2">
          {title} {icon}
        </label>
        <button
          onClick={() => onAddState(type)}
          className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-green-500 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-1">
        {states.map((state) => (
          <div
            key={state}
            className="relative group block"
            onClick={() => {
              if (type === "global") {
                currentGlobalState === state
                  ? gmUpdateGlobalState("")
                  : gmUpdateGlobalState(state);
              } else if (type === "role") {
                onAssignState("role", state);
              } else {
                onAssignState(type as "player" | "public", state);
              }
            }}
          >
            <button
              className={`w-full p-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-between ${
                type === "global" && currentGlobalState === state
                  ? colorClasses.active ||
                    "bg-green-600 border-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                  : colorClasses.normal
              }`}
            >
              <span className="truncate">{state}</span>
              {type === "global" && currentGlobalState === state ? (
                <CheckCircle2 size={14} className="shrink-0 ml-2" />
              ) : (
                icon
              )}
            </button>
            <div className={actionButtonsClasses}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditState(type, state);
                }}
                className="p-1.5 bg-blue-600 rounded-full text-white hover:bg-blue-400 shadow-lg"
              >
                <Edit2 size={10} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteState(type, state);
                }}
                className="p-1.5 bg-red-600 rounded-full text-white hover:bg-red-400 shadow-lg"
              >
                <Trash2 size={10} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-right-4 duration-300">
      {/* ROL Section - At the top */}
      {renderStateGroup("ROL", roles, "role", <Fingerprint size={14} />, {
        normal:
          "bg-teal-950/20 border-teal-900/50 text-teal-400 hover:border-teal-500 hover:bg-teal-950/30",
      })}

      {renderStateGroup(
        "Estado Global",
        globalStates,
        "global",
        <Globe size={14} />,
        {
          normal:
            "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-600",
          active:
            "bg-green-600 border-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]",
        }
      )}
      {renderStateGroup(
        "Estados Personales",
        playerStates,
        "player",
        <EyeOff size={14} />,
        {
          normal:
            "bg-purple-950/20 border-purple-900/50 text-purple-400 hover:border-purple-500 hover:bg-purple-950/30",
        }
      )}
      {renderStateGroup(
        "Estados Públicos",
        publicStates,
        "public",
        <Eye size={14} />,
        {
          normal:
            "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-600",
        }
      )}
    </div>
  );
};

export default GMNarrativeTab;
