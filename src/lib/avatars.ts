export const AVATAR_OPTIONS = [
  {
    id: "panther",
    label: "Órbita",
    glyph: "orbit",
    background: "linear-gradient(145deg, #1c2117 0%, #0c0f0b 100%)",
    foreground: "#c6ff00",
  },
  {
    id: "fox",
    label: "Eclipse",
    glyph: "eclipse",
    background: "linear-gradient(145deg, #23242a 0%, #101115 100%)",
    foreground: "#f4f4f5",
  },
  {
    id: "panda",
    label: "Pulso",
    glyph: "pulse",
    background: "linear-gradient(145deg, #271b16 0%, #100c0a 100%)",
    foreground: "#ff7a33",
  },
  {
    id: "wolf",
    label: "Prisma",
    glyph: "prism",
    background: "linear-gradient(145deg, #201b2b 0%, #0e0b13 100%)",
    foreground: "#a78bfa",
  },
  {
    id: "lion",
    label: "Halo",
    glyph: "halo",
    background: "linear-gradient(145deg, #14252a 0%, #090f11 100%)",
    foreground: "#48d9ef",
  },
  {
    id: "owl",
    label: "Eixo",
    glyph: "axis",
    background: "linear-gradient(145deg, #2a1823 0%, #110a0e 100%)",
    foreground: "#f472b6",
  },
  {
    id: "alien",
    label: "Onda",
    glyph: "wave",
    background: "linear-gradient(145deg, #172033 0%, #0a0d14 100%)",
    foreground: "#60a5fa",
  },
  {
    id: "robot",
    label: "Núcleo",
    glyph: "core",
    background: "linear-gradient(145deg, #292213 0%, #100d08 100%)",
    foreground: "#fbbf24",
  },
] as const;

export type AvatarId = (typeof AVATAR_OPTIONS)[number]["id"];

export const DEFAULT_AVATAR: AvatarId = "panther";

export function isAvatarId(value: unknown): value is AvatarId {
  return AVATAR_OPTIONS.some((avatar) => avatar.id === value);
}

export function getAvatar(value: string | null | undefined) {
  return AVATAR_OPTIONS.find((avatar) => avatar.id === value) ?? AVATAR_OPTIONS[0];
}
