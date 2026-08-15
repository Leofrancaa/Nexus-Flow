import { cn } from "@/lib/utils";
import { getAvatar } from "@/lib/avatars";

interface UserAvatarProps {
  avatar?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: "h-10 w-10 text-[1.35rem]",
  md: "h-12 w-12 text-[1.65rem]",
  lg: "h-16 w-16 text-[2.25rem]",
};

export function UserAvatar({ avatar, className, size = "md" }: UserAvatarProps) {
  const option = getAvatar(avatar);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/25 shadow-[0_8px_28px_-12px_rgba(0,0,0,.8)]",
        option.background,
        SIZES[size],
        className
      )}
    >
      <span className="drop-shadow-[0_2px_5px_rgba(0,0,0,.45)]">{option.emoji}</span>
      <span
        aria-hidden="true"
        className="absolute inset-x-1 top-0 h-1/3 rounded-full bg-white/20 blur-sm"
      />
    </span>
  );
}
