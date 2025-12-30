# 🏛️ PROYECTO: LA CASA SIN PAPEL

## 1. Misión y Visión

Web App progresiva (PWA) para gestionar juegos de rol asimétricos (Game Master vs Jugadores).

- **Vibe:** Tensión, "La Casa de Papel", Operativo Táctico, Hacker, Dark Mode.
- **Diseño:** Mobile-First, Alto Contraste, Minimalista. Premium Aesthetics.
- **Objetivo:** Sincronización en tiempo real mediante Firebase.

---

## 2. Reglas de Oro (INQUEBRANTABLES)

Cualquier agente que modifique el código debe respetar estas leyes bajo cualquier circunstancia:

1.  **NO Romper la UI:** El diseño visual (CSS/Tailwind) de los componentes actuales (`MainLayout`, `LoginView`, `PatioView`, `UIGameMaster`, `UIPlayer`) está **aprobado**. No alterar clases de estilo ni estructura HTML salvo error crítico.
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
├── public/          # Activos estáticos
├── src/
│   ├── components/  # Componentes React
│   ├── App.tsx      # Lógica de ruteo por estado
│   ├── store.ts     # Cerebro de la App (Zustand + Firebase logic)
│   ├── types.ts     # Contratos de datos
│   ├── firebaseConfig.ts
│   └── vite-env.d.ts
├── index.html       # Entry point
└── ...configs
```

---

## 5. Componentes Clave y Lógica

- **`MainLayout`:** Contenedor global. Ejecuta `subscribeToRoom` una sola vez al montar.
- **`LoginView`:** Acceso inicial. El modo GM usa el código `1010`.
- **`PatioView`:** Sala de espera y planificación.
  - **Votación:** Los jugadores votan misiones incrementando contadores en `rooms/defaultRoom/votes`.
  - **Ready Check:** Botón para marcar disponibilidad (`ready`).
  - **Manuales:** Uso de `ManualModal` para leer protocolos de misiones.
- **`UIGameMaster`:**
  - Control de tiempo (`clock`), noticias (`ticker`) y fases (`globalState`).
  - Botón **INICIAR/DETENER** misión que cambia el `status` global.
- **`UIPlayer`:** Interfaz táctica de juego (solo activa cuando `status === 'playing'`).

---

## 6. Estructura de Datos (Firebase Schema)

Raíz: `rooms/defaultRoom`

```json
{
  "status": "waiting | playing",
  "gameSelected": "ID_DEL_JUEGO",
  "ticker": "Texto marquesina",
  "clock": "00:00",
  "globalState": "Fase (Día 1, etc)",
  "votes": {
    "ID_JUEGO": number
  },
  "players": {
    "UID": {
      "nickname": "string",
      "isGM": boolean,
      "ready": boolean,
      "status": "online",
      "role": "string"
    }
  },
  "chat": {
    "ID": {
      "user": "string",
      "text": "string",
      "timestamp": number,
      "role": "gm | player"
    }
  }
}
```

---

## 7. Instrucciones para Agentes de IA

- **Zustand Primero:** Cualquier lógica de datos nueva debe ir en `src/store.ts`. No añadir lógica de Firebase directamente en los componentes.
- **Conflictos de Nombre:** En `src/store.ts` usa Siempre `firebaseSet` para diferenciar del `set` de Zustand.
- **Estilo:** Seguir la paleta `neutral-900`, `neutral-950` con acentos en `red-600` / `red-900` y `green-500` (para estados positivos/online).
- **Tipado:** No usar `any`. Definir interfaces en `types.ts`.
- **Iconografía:** Usar consistentemente `lucide-react`. Si un componente pide `User` y da error, verificar si es `Users`.
