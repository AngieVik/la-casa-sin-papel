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
2.  **Estado Global Único:** Todo el estado de la aplicación (usuario, sala, chat, UI) se gestiona **exclusivamente con Zustand** en `src/store.ts`. Prohibido crear estados locales complejos o usar Context API/Redux.
3.  **Arquitectura de Chat:** El chat es estrictamente un **componente Modal/Overlay** (`ChatModal.tsx`) que se superpone a la pantalla. Se activa con un botón flotante (FAB). **Nunca** debe incrustarse en el flujo del documento ni en un footer fijo.
4.  **Backend Realtime:** Usar estrictamente **Firebase Realtime Database** (`firebase/database`). **PROHIBIDO** usar Firestore.
5.  **Layout Sin Footer:** El `MainLayout` no tiene footer de navegación. Usa un Header de dos filas (Reloj/Usuario + Ticker) y el resto es área de contenido.
6.  **Hosting Integrado:** Preferir Firebase Hosting para el despliegue del frontend, manteniendo el ecosistema unificado.
7.  **Estructura Estándar:** Mantener todos los archivos de código fuente dentro de `src/`. Usar el alias `@` para referenciar la carpeta `src`.

---

## 3. Stack Tecnológico (Estricto)

- **Core:** React 19 + Vite 6 + TypeScript.
- **Estilos:** Tailwind CSS 3 (Configurado en `src/index.css`).
- **Iconos:** `lucide-react`.
- **Estado:** `zustand` 5.
- **Backend:** Firebase 12 (Auth Anónimo + Realtime Database).
- **Hosting:** Firebase Hosting.

---

## 4. Estructura de Carpetas

```text
/
├── public/          # Activos estáticos
├── src/
│   ├── components/  # Componentes React (Atómicos y Vistas)
│   ├── App.tsx      # Componente Raíz / Router Lógico
│   ├── index.tsx    # Punto de entrada React
│   ├── index.css    # Estilos globales y Tailwind
│   ├── store.ts     # Estado global (Zustand)
│   ├── types.ts     # Definiciones de TypeScript
│   └── firebaseConfig.ts
├── index.html       # Entry point HTML (Apunta a /src/index.tsx)
├── vite.config.ts   # Configuración de Vite (Alias @ -> /src)
└── tailwind.config.js
```

---

## 5. Componentes Clave y Lógica

- **`LoginView`:** Entrada de Nickname y acceso GM (password: "1010"). Ejecuta `loginToFirebase`.
- **`UIGameMaster` (Tablet):** Panel con 3 pestañas (Operativos, Narrativa, Acciones). Escritura directa en `ticker`, `clock` y `globalState`.
- **`UIPlayer` (Móvil):** Muestra el rol, estado global y lista de compañeros sincronizada.
- **`MainLayout`:** Gestiona el `ChatModal` y contiene el listener `subscribeToRoom` para la sincronización total.

---

## 6. Estructura de Datos (Firebase Schema)

El proyecto utiliza la ruta raíz `rooms/defaultRoom`. Estructura obligatoria:

```json
{
  "ticker": "Texto de marquesina (String)",
  "clock": "00:00 (String)",
  "globalState": "Fase actual (String)",
  "players": {
    "UID_DEL_USUARIO": {
      "nickname": "string",
      "isGM": boolean,
      "ready": boolean,
      "status": "online|offline",
      "role": "string"
    }
  },
  "chat": {
    "ID_MENSAJE": {
      "user": "string",
      "text": "string",
      "timestamp": number,
      "role": "gm|player"
    }
  }
}
```

---

## 7. Instrucciones para Agentes de IA

- **Análisis:** Antes de codear, lee `src/store.ts` para entender las acciones de Zustand disponibles.
- **Lógica:** Si falta funcionalidad de backend, añádela a `src/store.ts` primero y luego consúmela en la vista.
- **Código:** Mantener código limpio, modular y estrictamente tipado con TypeScript.
- **Alias:** Utiliza `@/components/XXX` para importaciones en lugar de rutas relativas largas.
- **Estilos:** No crear archivos CSS nuevos. Todo el estilo debe ir en clases de Tailwind o, si es estrictamente necesario, en `src/index.css`.
