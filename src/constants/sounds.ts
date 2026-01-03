export const SOUNDS = [
  { id: "gong", emoji: "🔔", name: "GONG" },
  { id: "aullido", emoji: "🐺", name: "Aullido" },
  { id: "gallo", emoji: "🐓", name: "Gallo" },
  { id: "risabruja", emoji: "🧙‍♀️", name: "Risa Bruja" },
  { id: "reallynigga", emoji: "😤", name: "Really Nigga" },
] as const;

export type SoundId = (typeof SOUNDS)[number]["id"];
export type Sound = (typeof SOUNDS)[number];

// Helper to get sound info by ID
export const getSoundById = (id: string): Sound | undefined =>
  SOUNDS.find((s) => s.id === id);
