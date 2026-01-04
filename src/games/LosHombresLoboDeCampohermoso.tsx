import React, { useState, useEffect } from "react";
import {
  Users,
  Moon,
  Sun,
  Eye,
  Heart,
  Skull,
  Shield,
  CheckCircle2,
  Circle,
  Gavel,
  ArrowRight,
  HelpCircle,
  Zap,
} from "lucide-react";
import { useStore } from "../store";
import { GameMetadata, GameModule, Player, GameId } from "../types";

// ==========================================
// 1. CONFIGURACIÓN DE ROLES Y DATOS
// ==========================================

const ROLE_DESCRIPTIONS: Record<string, string> = {
  Aldeano:
    "Habitante sin poderes. Tu único objetivo es detectar y linchar a los hombres lobo.",
  Vidente:
    "Cada noche eliges a un jugador para conocer su verdadera identidad secreta.",
  Bruja:
    "Tienes 2 pociones de un solo uso: una para revivir a un muerto y otra para matar a alguien.",
  Cazador:
    "Si mueres, disparas una última bala inmediatamente, matando al jugador que elijas.",
  Cupido:
    "La primera noche disparas tus flechas para enamorar a dos jugadores.",
  Ladrón:
    "Al inicio, miras las 2 cartas sobrantes. Puedes cambiar tu carta (obligado si son 2 lobos).",
  Alguacil:
    "Tu voto vale doble en caso de empate. Si mueres, debes nombrar a tu sucesor.",
  Protector:
    "Cada noche proteges a alguien del ataque de los lobos. No puedes repetir.",
  Ankú: "Tras morir, puedes votar en dos linchamientos más y hablar con los muertos.",
  Chamán:
    "Hablas con los muertos por la noche y les obligas a seguir jugando como vivos.",
  Noctambulo:
    "Eliges con quién dormir cada noche. Esa persona pierde sus poderes esa noche y tú sabes quién es.",
  Titiritero: "Puedes suplantar a un Lobo por la noche (actuando con ellos).",
  Farmacéutica:
    "Tienes poción de anular poderes y poción de vida (esta última solo funciona si se la das a la Bruja).",
  Astrónomo:
    "Lees un mensaje anónimo escrito por los jugadores la noche anterior.",
  Cuervo:
    "Maldices a un jugador. Ese jugador empieza la votación del día siguiente con 2 votos en contra.",
  Gitana:
    "Usas cartas de espiritismo para que los muertos respondan preguntas (Sí/No) a través de un médium.",
  NiñaPequeña:
    "Puedes espiar (entreabrir ojos) en el turno de los lobos. Si te pillan, mueres tú.",
  DosHermanas:
    "Os despertáis la primera noche (y noches alternas) para conspirar juntas.",
  TresHermanos:
    "Os despertáis la primera noche (y noches alternas) para conspirar juntos.",
  ElTonto:
    "Si la aldea te lincha, revelas tu identidad y te salvas, pero pierdes el voto.",
  HombreLobo:
    "Despiertas de noche para matar. De día finges ser aldeano. Si elimináis a todos, ganáis.",
  ElAnciano:
    "Deben atacarte 2 veces los lobos para matarte. Si te mata un aldeano, todos pierden sus poderes.",
  ElAsesino:
    "Si te linchan, activas tu poder para matar a alguien dos noches después.",
  GatoDelDestino:
    "Tienes 9 vidas. Pierdes 2 por día o ataque. Si las pierdes todas, te vuelves aldeano normal.",
  CaballeroEspadaOxidada:
    "Si mueres, el lobo a tu izquierda morirá al día siguiente por la herida de tu espada.",
  CabezaDeTurco:
    "Si hay empate en la votación, mueres tú. Al morir, decides quién puede votar al día siguiente.",
  DomadorDeOsos: "Si tienes un lobo al lado, el narrador gruñe por la mañana.",
  JuezTartamudo:
    "Una vez por partida, puedes ordenar un segundo linchamiento inmediato tras el primero.",
  TontoDeLaAldea:
    "Si te linchan, revelas tu carta y sobrevives, pero pierdes el derecho a voto, si muere el anciano tu mueres con el.",
  DamaDeLaLuna:
    "Eliges compañero cada noche; esa persona pierde sus poderes esa noche por estar contigo.",
};

const ROLES_ORDERED_NIGHT = [
  "Ladrón", // Fase 0
  "Cupido", // Fase 0
  "Protector",
  "Vidente",
  "HombreLobo",
  "Bruja",
];

// ==========================================
// 2. COMPONENTES AUXILIARES
// ==========================================

// Tarjeta de Rol con Hover
const RoleCard: React.FC<{ role: string; className?: string }> = ({
  role,
  className = "",
}) => {
  return (
    <div
      className={`group relative flex items-center justify-center p-3 rounded-xl border border-neutral-700 bg-neutral-800 cursor-help transition-all hover:bg-neutral-700 ${className}`}
    >
      <span className="font-bold text-neutral-200">{role}</span>

      {/* Hover Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 hidden group-hover:block z-50 animate-in fade-in zoom-in duration-200">
        <div className="bg-neutral-950 border border-neutral-600 rounded-lg p-3 shadow-2xl text-sm text-neutral-300 relative">
          <div className="font-bold text-white mb-1 border-b border-neutral-800 pb-1">
            {role}
          </div>
          {ROLE_DESCRIPTIONS[role] || "Sin descripción disponible."}
          {/* Flechita del tooltip */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-neutral-950"></div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. INTERFAZ DEL JUGADOR (CLIENTE)
// ==========================================

const PlayerView: React.FC = () => {
  const { user, room } = useStore();
  const player = room.players.find((p) => p.id === user.id);
  const myRoles = player?.roles || [];
  const isDead = player?.publicStates?.includes("Muerto");
  const isNight = room.globalState === "Noche";

  if (!player) return <div>Cargando...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center space-y-6">
      {/* Estado Global */}
      <div className="animate-in fade-in slide-in-from-top duration-700">
        {isNight ? (
          <Moon size={64} className="text-indigo-400 mx-auto mb-4" />
        ) : (
          <Sun size={64} className="text-orange-400 mx-auto mb-4" />
        )}
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase">
          {room.globalState}
        </h2>
        <p className="text-neutral-400 mt-2 text-sm font-mono">
          {isDead
            ? "Estás muerto. Los muertos no hablan."
            : isNight
            ? "La aldea duerme... espera tu turno."
            : "Debate y encuentra a los culpables."}
        </p>
      </div>

      {/* Tarjetas de Rol */}
      <div className="w-full max-w-sm space-y-2">
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">
          Tu Identidad (Pasa el ratón)
        </h3>
        {myRoles.length > 0 ? (
          myRoles.map((role, idx) => <RoleCard key={idx} role={role} />)
        ) : (
          <div className="p-4 border border-dashed border-neutral-700 rounded-xl text-neutral-500">
            Esperando reparto de roles...
          </div>
        )}
      </div>

      {/* Estados */}
      {player.publicStates && player.publicStates.length > 0 && (
        <div className="flex gap-2 justify-center flex-wrap">
          {player.publicStates.map((st) => (
            <span
              key={st}
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                st === "Muerto"
                  ? "bg-red-900/20 border-red-800 text-red-500"
                  : "bg-blue-900/20 border-blue-800 text-blue-400"
              }`}
            >
              {st}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 4. INTERFAZ DEL GAMEMASTER (CORE LOGIC)
// ==========================================

const GMView: React.FC = () => {
  const {
    room,
    gmUpdateGlobalState,
    setGamePhase,
    gmTogglePublicState,
    gmTogglePlayerRole,
    gmSendGlobalMessage,
  } = useStore();
  const phase = room.gamePhase; // 0, 1, 2, 3...

  // Checklist local para las acciones del GM en cada fase
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [lastSelectedRole, setLastSelectedRole] = useState<string | null>(null);

  const toggleCheck = (id: string) => {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleRoleSelection = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
    setLastSelectedRole(role);
  };

  // Reiniciar checklist al cambiar de fase
  useEffect(() => {
    setChecklist({});
  }, [phase]);

  const activePlayers = room.players.filter(
    (p) => !p.publicStates?.includes("Muerto")
  );

  const deadPlayers = room.players.filter((p) =>
    p.publicStates?.includes("Muerto")
  );

  // --- LOGICA DE DISTRIBUCIÓN DE ROLES ---
  const handleDistributeRoles = async () => {
    if (selectedRoles.length < room.players.length) {
      alert(
        `Necesitas al menos ${room.players.length} roles para ${room.players.length} jugadores.`
      );
      return;
    }

    await gmSendGlobalMessage("🎲 El Narrador está repartiendo las cartas...");

    // 1. Barajar los roles seleccionados
    const shuffledRoles = [...selectedRoles].sort(() => Math.random() - 0.5);

    // 2. Asignar cada rol a un jugador
    for (let i = 0; i < room.players.length; i++) {
      const player = room.players[i];
      const roleToAssign = shuffledRoles[i];

      // Limpiamos sus roles anteriores y ponemos el nuevo
      // Nota: gmTogglePlayerRole suele añadir/quitar.
      // Dependiendo de tu implementación exacta del store,
      // podrías necesitar una acción que 'setee' el array completo.
      // Aquí usaremos la lógica de borrar previos y añadir.
      await gmTogglePlayerRole(player.id, roleToAssign);
    }

    toggleCheck("p0_reparto");
  };

  // --- RENDERIZADO DE PASOS POR FASE ---

  const renderPhase0 = () => (
    <div className="space-y-4 animate-in fade-in">
      {/* Display de contador y último rol seleccionado */}
      <div className="p-2">
        <div className="flex items-center justify-between">
          {/* Display de dos líneas a la izquierda */}
          <div className="flex-1 min-w-0">
            {lastSelectedRole ? (
              <>
                <p className="font-bold text-white truncate">
                  {lastSelectedRole}
                </p>
                <p className="text-xs text-neutral-400 line-clamp-2">
                  {ROLE_DESCRIPTIONS[lastSelectedRole] || "Sin descripción"}
                </p>
              </>
            ) : (
              <>
                <p className="font-bold text-neutral-500">Selecciona un rol</p>
                <p className="text-xs text-neutral-600">
                  Haz click en una tarjeta
                </p>
              </>
            )}
          </div>

          {/* Contador y botón repartir a la derecha */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-2xl font-black text-white font-mono">
              {selectedRoles.length}/{room.players.length}
            </span>
            <button
              onClick={handleDistributeRoles}
              disabled={
                selectedRoles.length < room.players.length ||
                checklist["p0_reparto"]
              }
              className={`flex items-center gap-1 px-2 py-2 rounded-lg font-bold text-sm transition-all ${
                checklist["p0_reparto"]
                  ? "bg-green-600/20 text-green-500 border border-green-600"
                  : "bg-neutral-600 text-white hover:bg-neutral-500 disabled:opacity-50"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="4" width="6" height="10" rx="1" />
                <rect x="9" y="6" width="6" height="10" rx="1" />
                <rect x="16" y="8" width="6" height="10" rx="1" />
              </svg>
              {checklist["p0_reparto"] ? "✓" : "Repartir"}
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas de roles en flexbox wrap cuadradas */}
      <div className="flex flex-wrap gap-1 justify-center">
        {Object.keys(ROLE_DESCRIPTIONS).map((role) => (
          <button
            key={role}
            onClick={() => toggleRoleSelection(role)}
            className={`aspect-[2/1] min-h-[60px] min-w-[100px] w-[100px] md:w-[120px] p-1 rounded-xl border-2 transition-all flex items-center justify-center text-center ${
              selectedRoles.includes(role)
                ? "bg-red-800 border-neutral-900/10 text-white font-bold shadow-lg shadow-black-500/30"
                : "bg-neutral-400 border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:bg-neutral-400/80"
            }`}
          >
            <span className="font-miltonian font-bold text-black text-xs md:text-sm leading-tight break-words">
              {role.replace(/([A-Z])/g, " $1").trim()}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderPhaseDay = (dayNumber: number) => (
    <div className="space-y-4 animate-in fade-in">
      <div className="bg-orange-900/20 border border-orange-500/30 p-4 rounded-xl">
        <h3 className="text-orange-400 font-bold text-lg mb-2 flex items-center gap-2">
          <Sun size={20} /> Fase {phase}: Día {dayNumber}
        </h3>

        {/* LISTA DE VIVOS */}
        <div className="mb-4">
          <h4 className="text-xs font-bold text-neutral-500 uppercase mb-2">
            Jugadores Vivos para Debate:
          </h4>
          <div className="flex flex-wrap gap-2">
            {activePlayers.map((p) => (
              <span
                key={p.id}
                className="text-xs bg-neutral-800 px-2 py-1 rounded text-neutral-300 border border-neutral-700"
              >
                {p.nickname}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {/* Eventos del día */}
          <div
            onClick={() => toggleCheck("p_dia_muertes")}
            className="flex items-center gap-2 cursor-pointer"
          >
            {checklist["p_dia_muertes"] ? (
              <CheckCircle2 size={16} className="text-green-500" />
            ) : (
              <Circle size={16} />
            )}
            <span>Anunciar muertos de la noche y voltear cartas.</span>
          </div>
          <div
            onClick={() => toggleCheck("p_dia_poderes")}
            className="flex items-center gap-2 cursor-pointer"
          >
            {checklist["p_dia_poderes"] ? (
              <CheckCircle2 size={16} className="text-green-500" />
            ) : (
              <Circle size={16} />
            )}
            <span>
              Poderes post-mortem (Cazador dispara, Enamorados suicidio).
            </span>
          </div>
          <div
            onClick={() => toggleCheck("p_dia_debate")}
            className="flex items-center gap-2 cursor-pointer"
          >
            {checklist["p_dia_debate"] ? (
              <CheckCircle2 size={16} className="text-green-500" />
            ) : (
              <Circle size={16} />
            )}
            <span>Debate y Votación.</span>
          </div>
          <div
            onClick={() => toggleCheck("p_dia_linchamiento")}
            className="flex items-center gap-2 cursor-pointer"
          >
            {checklist["p_dia_linchamiento"] ? (
              <CheckCircle2 size={16} className="text-green-500" />
            ) : (
              <Circle size={16} />
            )}
            <span>Linchamiento (Marcar muerto).</span>
          </div>
        </div>
      </div>

      {/* GESTIÓN DE MUERTES RÁPIDA */}
      <div className="bg-neutral-800 p-3 rounded-xl">
        <h4 className="text-xs font-bold text-neutral-500 mb-2">
          Gestión de Linchamiento
        </h4>
        <div className="flex flex-wrap gap-2">
          {activePlayers.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                if (confirm(`¿Linchar a ${p.nickname}?`)) {
                  gmTogglePublicState(p.id, "Muerto");
                }
              }}
              className="text-xs border border-red-900/50 bg-red-900/10 text-red-400 px-2 py-1 rounded hover:bg-red-900/30"
            >
              💀 {p.nickname}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPhaseNight = () => (
    <div className="space-y-4 animate-in fade-in">
      <div className="bg-indigo-950/50 border border-indigo-500/30 p-4 rounded-xl">
        <h3 className="text-indigo-400 font-bold text-lg mb-2 flex items-center gap-2">
          <Moon size={20} /> Fase {phase}: Noche
        </h3>
        <p className="text-xs text-neutral-400 mb-4">
          Llama a los roles en orden. Solo visibles si están vivos.
        </p>

        <div className="space-y-3">
          {/* 1. VIDENTE */}
          <div
            className={`p-3 rounded-lg border ${
              checklist["night_vidente"]
                ? "opacity-50 bg-neutral-900"
                : "bg-indigo-900/20 border-indigo-700"
            }`}
          >
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleCheck("night_vidente")}
            >
              <div className="flex items-center gap-2">
                <Eye className="text-indigo-400" size={18} />
                <span className="font-bold">1. La Vidente</span>
              </div>
              {checklist["night_vidente"] ? (
                <CheckCircle2 className="text-green-500" />
              ) : (
                <Circle className="text-neutral-500" />
              )}
            </div>
            {/* Tooltip descriptivo */}
            <div className="mt-1 text-xs text-neutral-500 pl-6">
              Se despierta y señala un jugador. Muéstrale su carta.
              <div className="group inline-block ml-2 relative">
                <HelpCircle size={12} className="inline text-neutral-600" />
                <span className="hidden group-hover:block absolute bottom-full bg-black border p-2 w-48 z-50 text-xs text-white">
                  {ROLE_DESCRIPTIONS["Vidente"]}
                </span>
              </div>
            </div>
          </div>

          {/* 2. HOMBRES LOBO */}
          <div
            className={`p-3 rounded-lg border ${
              checklist["night_lobos"]
                ? "opacity-50 bg-neutral-900"
                : "bg-red-900/10 border-red-900"
            }`}
          >
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleCheck("night_lobos")}
            >
              <div className="flex items-center gap-2">
                <Users className="text-red-400" size={18} />
                <span className="font-bold">2. Hombres Lobo</span>
              </div>
              {checklist["night_lobos"] ? (
                <CheckCircle2 className="text-green-500" />
              ) : (
                <Circle className="text-neutral-500" />
              )}
            </div>
            <div className="mt-2 text-xs text-neutral-400 pl-6">
              Despiertan, reconocen y eligen víctima.
              <p className="text-yellow-600 mt-1 italic">
                ¡Ojo! La <strong>Niña Pequeña</strong> puede estar espiando.
              </p>
            </div>
            {/* Selector de víctima para el GM */}
            {!checklist["night_lobos"] && (
              <div className="mt-2 pl-6">
                <p className="text-[10px] uppercase font-bold text-neutral-500 mb-1">
                  Marcar víctima (Preliminar):
                </p>
                <div className="flex flex-wrap gap-1">
                  {activePlayers.map((p) => (
                    <button
                      key={p.id}
                      onClick={() =>
                        gmSendGlobalMessage(
                          `(GM Note) Lobos eligen a ${p.nickname}`
                        )
                      }
                      className="text-[10px] bg-red-950 text-red-300 border border-red-900 px-2 py-1 rounded hover:bg-red-900"
                    >
                      {p.nickname}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. BRUJA */}
          <div
            className={`p-3 rounded-lg border ${
              checklist["night_bruja"]
                ? "opacity-50 bg-neutral-900"
                : "bg-fuchsia-900/10 border-fuchsia-900"
            }`}
          >
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleCheck("night_bruja")}
            >
              <div className="flex items-center gap-2">
                <Zap className="text-fuchsia-400" size={18} />
                <span className="font-bold">3. La Bruja</span>
              </div>
              {checklist["night_bruja"] ? (
                <CheckCircle2 className="text-green-500" />
              ) : (
                <Circle className="text-neutral-500" />
              )}
            </div>
            <div className="mt-1 text-xs text-neutral-500 pl-6">
              Indica quién muere. ¿Usa poción vida? ¿Usa poción muerte?
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render condicional basado en la fase
  // Fase 0: Setup
  // Fase 1: Día 1
  // Fase 2: Noche 1
  // Fase 3: Día 2
  // Fase 4: Noche 2...

  if (phase === 0) return renderPhase0();
  // Fases impares = DÍA
  if (phase % 2 !== 0) return renderPhaseDay(Math.ceil(phase / 2));
  // Fases pares = NOCHE
  return renderPhaseNight();
};

// ==========================================
// 5. COMPONENTE PRINCIPAL DEL JUEGO
// ==========================================

const LosHombresLoboDeCampohermoso: React.FC = () => {
  const { user, room } = useStore();
  const isGM = user.isGM;

  // Si estamos en Lobby, mostrar pantalla de espera genérica o intro
  if (room.gameStatus === "lobby") {
    return (
      <div className="text-center p-10">
        <h1 className="text-4xl font-black text-red-600 mb-4 tracking-tighter">
          🐺 Los Hombres Lobo 🐺
        </h1>
        <p className="text-xl text-neutral-400">de Campohermoso</p>
        <div className="mt-8 p-4 bg-neutral-900 rounded-xl max-w-md mx-auto border border-neutral-800">
          <p className="text-sm text-neutral-500">
            Esperando a que el Narrador inicie la partida...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto pb-20">
      {isGM ? <GMView /> : <PlayerView />}
    </div>
  );
};

// DEFINICIÓN DEL MÓDULO (Para types.ts / games.ts)
export const LosHombresLoboMetadata: GameMetadata = {
  id: "hombres_lobo_campohermoso", // De la definición GameId en ../types.ts
  // Para navegar: Haz Ctrl+Click en 'GameMetadata' o abre ../types.ts
  title: "Los Hombres Lobo de Campohermoso",
  description:
    "El clásico juego de engaño, roles ocultos y linchamientos en tu pueblo.",
  minRoles: ["HombreLobo", "Aldeano"], 
  specificData: {
    roles: Object.keys(ROLE_DESCRIPTIONS),
    playerStates: ["Enamorado", "Protegido", "Silenciado", "Maldito"],
    publicStates: ["Vivo", "Muerto", "Alguacil"],
    globalStates: ["Día", "Noche"],
  },
  icon: (props) => <Moon {...props} />, // O un icono de Lobo si tienes
  themeColor: "bg-red-900",
};

export default LosHombresLoboDeCampohermoso;
