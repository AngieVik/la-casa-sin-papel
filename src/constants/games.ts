export const GAMES = [
  {
    id: "juego1",
    title: "Atraco al Banco",
    desc: "Gestión de recursos y tiempo.",
  },
  { id: "juego2", title: "El Topo", desc: "Roles ocultos y deducción." },
  { id: "juego3", title: "Protocolo Fantasma", desc: "Hackeo y sigilo." },
  {
    id: "juego4",
    title: "Motín en la Prisión",
    desc: "Acción y control de áreas.",
  },
  { id: "juego5", title: "La Fuga", desc: "Cooperativo contra reloj." },
  { id: "juego6", title: "Negociación", desc: "Social y bluffing." },
] as const;

export type GameId = (typeof GAMES)[number]["id"];
export type Game = (typeof GAMES)[number];
