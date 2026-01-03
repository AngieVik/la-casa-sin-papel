# 🏛️ PROYECTO: LA CASA SIN PAPEL

## 1. Misión y Visión

Web App progresiva (PWA) para gestionar juegos de rol asimétricos (Game Master vs Jugadores).

- **Vibe:** Tensión, "La Casa de Papel", Operativo Táctico, Hacker, Dark Mode.
- **Diseño:** Mobile-First, Alto Contraste, Minimalista. Premium Aesthetics.
- **Objetivo:** Sincronización en tiempo real mediante Firebase.

---

## 2. Reglas de Oro (INQUEBRANTABLES)

Cualquier agente que modifique el código debe respetar estas leyes bajo cualquier circunstancia:

1.  **NO Romper la UI:** El diseño visual (CSS/Tailwind) de los componentes actuales está **aprobado**. No alterar clases de estilo ni estructura HTML salvo error crítico.
2.  **Estado Global Único:** Todo el estado de la aplicación se gestiona **exclusivamente con Zustand** en `src/store.ts`. Prohibido crear estados locales complejos o usar Context API/Redux.
3.  **Transiciones Automáticas:** Los jugadores **no cambian de vista manualmente** (excepto Login). La transición entre `patio` y `player` está dictada por el campo `status` ('waiting' | 'playing') de la habitación en Firebase.
4.  **Arquitectura de Chat:** El chat es un **componente Modal/Overlay** (`ChatModal.tsx`) activado por un FAB de color rojo. Nunca debe incrustarse en el flujo del documento.
5.  **Backend Realtime:** Usar estrictamente **Firebase Realtime Database**. **PROHIBIDO** usar Firestore. Para evitar conflictos con Zustand, importar el método como: `import { set as firebaseSet } from "firebase/database"`.
6.  **Layout Táctico:** El `MainLayout` incluye un Header de dos filas (Fila 1: Pulso de conexión + Reloj + Nickname | Fila 2: Ticker informativo). El fondo es `bg-neutral-950`.
7.  **Estructura Estándar:** Todos los archivos en `src/`. Usar el alias `@` para referenciar la carpeta `src`.

---

## 3. Stack Tecnológico (Estricto)

- **Core:** React 19 + Vite 6 + TypeScript.
- **Vite Env:** Referencia en `src/vite-env.d.ts` para tipado de `import.meta.env`.
- **Estilos:** Tailwind CSS 3 (Configurado en `src/index.css`).
- **Iconos:** `lucide-react`.
- **Estado:** `zustand` 5.
- **Backend:** Firebase 12 (Auth Anónimo + Realtime Database).

---

## 4. Estructura de Carpetas

```text
/
├── public/               # Activos estáticos
├── src/
│   ├── components/       # 9 Componentes React
│   │   ├── MainLayout.tsx        # Contenedor global + Header + Ticker
│   │   ├── LoginView.tsx         # Acceso inicial (GM: código 1010)
│   │   ├── PatioView.tsx         # Sala de espera + Votación
│   │   ├── UIGameMaster.tsx      # Panel de control GM (1662 líneas)
│   │   ├── UIPlayer.tsx          # Interfaz táctica jugador
│   │   ├── ChatModal.tsx         # Sistema de chat multicanal
│   │   ├── ConfirmModal.tsx      # Diálogos de confirmación
│   │   ├── ManualModal.tsx       # Manuales de juegos
│   │   └── ModalWrapper.tsx      # Wrapper universal para modales
│   ├── hooks/
│   │   └── useGameClock.ts       # Hook pasivo de reloj (client-side)
│   ├── sounds/                   # 8 archivos de sonido (.mp3)
│   ├── App.tsx           # Lógica de ruteo por estado
│   ├── store.ts          # Cerebro de la App (759 líneas, 40+ acciones)
│   ├── types.ts          # Contratos de datos (165 líneas)
│   ├── firebaseConfig.ts # Configuración de Firebase
│   └── vite-env.d.ts     # Tipos de Vite
├── index.html            # Entry point
└── ...configs
```

---

## 5. Componentes Clave y Lógica

### Vistas Principales

- **`MainLayout`:** Contenedor global. Ejecuta `subscribeToRoom` una sola vez al montar. Incluye heartbeat de 30s para `lastSeen`.
- **`LoginView`:** Acceso inicial. El modo GM usa el código `1010`. Restauración de sesión automática.
- **`PatioView`:** Sala de espera y planificación.
  - **Votación:** Los jugadores votan misiones en `rooms/defaultRoom/votes`.
  - **Ready Check:** Botón para marcar disponibilidad (`ready`).
  - **Manuales:** Uso de `ModalWrapper` para leer protocolos de misiones.
- **`UIGameMaster`:** Panel de control completo (1662 líneas) con 3 pestañas:
  - **Control:** Gestión de jugadores, edición de roles, estados.
  - **Narrativa:** Selector de juegos, estados globales/personales/públicos editables.
  - **Acciones:** Mensajes globales, sonidos, vibraciones, voz divina, ticker, reloj.
- **`UIPlayer`:** Interfaz táctica de juego (solo activa cuando `status === 'playing'`). Notificaciones, sonidos, historial persistido.

### Sistema de Chat

- **`ChatModal`:** Chat multicanal con:
  - Canal **Global**: Público para todos.
  - Canal **Privado**: Entre jugador y GM (`private_${userId}`).
  - **Salas grupales**: Creadas por GM (`room_${roomId}`).
  - Indicador de escritura con debounce de 400ms.
  - GM puede crear/gestionar/cerrar salas.

### Sistema de Reloj

- **`useGameClock`:** Hook pasivo que calcula el tiempo localmente sin escribir a Firebase.
  - Modos: `static` | `countdown` | `stopwatch`.
  - Usa `setInterval` de 1000ms cuando está corriendo.
  - Soporta pausa/reanudación con `startTime` y `pausedAt`.

---

## 6. Estructura de Datos (Firebase Schema)

Raíz: `rooms/defaultRoom`

```json
{
  "status": "waiting | playing",
  "gameSelected": "ID_DEL_JUEGO",
  "ticker": "Texto marquesina",
  "tickerSpeed": 20,
  "globalState": "Fase (Día 1, etc)",
  "clockConfig": {
    "mode": "static | countdown | stopwatch",
    "baseTime": 0,
    "isRunning": false,
    "startTime": null,
    "pausedAt": null
  },
  "globalStates": ["Día", "Noche"],
  "playerStates": ["Envenenado", "Peruano", "De Viator"],
  "publicStates": ["Vivo", "Muerto", "Carcel"],
  "votes": {
    "ID_JUEGO": { "UID": true }
  },
  "players": {
    "UID": {
      "nickname": "string",
      "isGM": false,
      "ready": false,
      "status": "online",
      "role": "Player",
      "playerStates": [],
      "publicStates": [],
      "lastSeen": 1234567890
    }
  },
  "channels": {
    "global": { "MSG_ID": { "user": "...", "text": "...", "timestamp": 123 } },
    "private_UID": { ... },
    "room_ROOM_ID": { ... }
  },
  "chatRooms": {
    "ROOM_ID": {
      "name": "Nombre Sala",
      "playerIds": ["uid1", "uid2"],
      "createdAt": 123456
    }
  },
  "notifications": {
    "NOTIF_ID": {
      "type": "sound | vibration | divineVoice | globalMessage",
      "payload": { "soundId": "gong", "message": "..." },
      "targetPlayerId": null,
      "timestamp": 123456
    }
  },
  "typing": {
    "channelName": { "userId": 1234567890 }
  }
}
```

---

## 7. Acciones del Store (40+)

### Acciones de Usuario

- `toggleChat`, `setCurrentView`, `setNickname`, `setGM`, `setActiveChannel`

### Acciones de Firebase

- `restoreAuthSession`, `loginToFirebase`, `subscribeToRoom`
- `sendChatMessage`, `updatePlayerStatus`, `voteForGame`, `setTyping`

### Acciones de GM - Control

- `gmUpdateTicker`, `gmSetTickerSpeed`, `gmUpdateGlobalState`
- `gmStartGame`, `gmEndGame`, `gmResetRoom`
- `gmKickPlayer`, `gmRemovePlayer`, `gmUpdatePlayerRole`
- `gmUpdatePlayerState`, `gmWhisper`

### Acciones de GM - Estados

- `gmAddGlobalState`, `gmEditGlobalState`, `gmDeleteGlobalState`
- `gmAddPlayerStateOption`, `gmEditPlayerStateOption`, `gmDeletePlayerStateOption`
- `gmAddPublicStateOption`, `gmEditPublicStateOption`, `gmDeletePublicStateOption`
- `gmTogglePlayerState`, `gmTogglePublicState`, `gmSelectGame`

### Acciones de GM - Reloj

- `gmSetBaseTime`, `gmStartClock`, `gmPauseClock`, `gmResetClock`, `gmSetStaticTime`

### Acciones de GM - Notificaciones

- `gmSendGlobalMessage`, `gmSendSound`, `gmSendVibration`, `gmSendDivineVoice`
- `clearNotification`

### Acciones de GM - Salas de Chat

- `gmCreateChatRoom`, `gmAddPlayerToRoom`, `gmRemovePlayerFromRoom`, `gmCloseChatRoom`

---

## 8. Instrucciones para Agentes de IA

- **Zustand Primero:** Cualquier lógica de datos nueva debe ir en `src/store.ts`. No añadir lógica de Firebase directamente en los componentes.
- **Conflictos de Nombre:** En `src/store.ts` usa Siempre `firebaseSet` para diferenciar del `set` de Zustand.
- **Estilo:** Seguir la paleta `neutral-900`, `neutral-950` con acentos en `red-600` / `red-900` y `green-500` (para estados positivos/online).
- **Tipado:** No usar `any`. Definir interfaces en `types.ts`.
- **Iconografía:** Usar consistentemente `lucide-react`. Si un componente pide `User` y da error, verificar si es `Users`.
- **Modales:** Usar `ModalWrapper` o `ConfirmModal` para diálogos. No usar `window.confirm()`.
- **Reloj:** El reloj es "pasivo" en Firebase y "activo" en el cliente via `useGameClock`.
