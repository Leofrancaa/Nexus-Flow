export const AVATAR_OPTIONS = [
  {
    id: "panther",
    label: "Pantera",
    position: "0% 10%",
  },
  {
    id: "fox",
    label: "Raposa",
    position: "33.333% 10%",
  },
  {
    id: "panda",
    label: "Panda",
    position: "66.667% 10%",
  },
  {
    id: "wolf",
    label: "Lobo",
    position: "100% 10%",
  },
  {
    id: "lion",
    label: "Leão",
    position: "0% 90%",
  },
  {
    id: "owl",
    label: "Coruja",
    position: "33.333% 90%",
  },
  {
    id: "alien",
    label: "Alienígena",
    position: "66.667% 90%",
  },
  {
    id: "robot",
    label: "Robô",
    position: "100% 90%",
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
