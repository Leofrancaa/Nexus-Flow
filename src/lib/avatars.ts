export const AVATAR_OPTIONS = [
  {
    id: "panther",
    label: "Pantera",
    emoji: "🐆",
    background: "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-300",
  },
  {
    id: "fox",
    label: "Raposa",
    emoji: "🦊",
    background: "bg-gradient-to-br from-orange-400 via-red-500 to-rose-700",
  },
  {
    id: "panda",
    label: "Panda",
    emoji: "🐼",
    background: "bg-gradient-to-br from-slate-100 via-slate-400 to-slate-900",
  },
  {
    id: "wolf",
    label: "Lobo",
    emoji: "🐺",
    background: "bg-gradient-to-br from-cyan-300 via-blue-500 to-indigo-800",
  },
  {
    id: "lion",
    label: "Leão",
    emoji: "🦁",
    background: "bg-gradient-to-br from-yellow-300 via-orange-500 to-red-700",
  },
  {
    id: "owl",
    label: "Coruja",
    emoji: "🦉",
    background: "bg-gradient-to-br from-lime-300 via-emerald-500 to-teal-800",
  },
  {
    id: "alien",
    label: "Alienígena",
    emoji: "👽",
    background: "bg-gradient-to-br from-brand via-emerald-400 to-cyan-700",
  },
  {
    id: "robot",
    label: "Robô",
    emoji: "🤖",
    background: "bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-700",
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
