import { cn } from "@/lib/utils";
import { getAvatar } from "@/lib/avatars";

interface UserAvatarProps {
  avatar?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: "h-10 w-10",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

export function UserAvatar({ avatar, className, size = "md" }: UserAvatarProps) {
  const option = getAvatar(avatar);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full border border-white/25 bg-bg shadow-[0_8px_28px_-12px_rgba(0,0,0,.8)]",
        SIZES[size],
        className
      )}
      style={{
        backgroundImage: "url('/avatar-atlas-v1.webp')",
        backgroundPosition: option.position,
        backgroundRepeat: "no-repeat",
        backgroundSize: "400% 266.667%",
      }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,.2),inset_0_-10px_20px_rgba(0,0,0,.12)]"
      />
    </span>
  );
}
