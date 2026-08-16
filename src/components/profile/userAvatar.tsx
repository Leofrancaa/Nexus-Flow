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

type AvatarGlyphName = ReturnType<typeof getAvatar>["glyph"];

function AvatarGlyph({ glyph }: { glyph: AvatarGlyphName }) {
  switch (glyph) {
    case "orbit":
      return (
        <>
          <ellipse cx="24" cy="24" rx="17" ry="9" fill="none" stroke="currentColor" strokeWidth="2.4" transform="rotate(-24 24 24)" />
          <circle cx="24" cy="24" r="5.5" fill="currentColor" />
          <circle cx="38" cy="17" r="2.2" fill="currentColor" />
        </>
      );
    case "eclipse":
      return <path d="M31.5 8.5a17 17 0 1 0 8 27.8A15.2 15.2 0 0 1 31.5 8.5Z" fill="currentColor" />;
    case "pulse":
      return <path d="M6 25h9l4-11 8 21 5-12 3 2h7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />;
    case "prism":
      return (
        <>
          <path d="M24 7 41 37H7L24 7Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2.6" />
          <circle cx="24" cy="27" r="4" fill="currentColor" />
        </>
      );
    case "halo":
      return (
        <>
          <circle cx="24" cy="24" r="15" fill="none" stroke="currentColor" strokeWidth="2.4" />
          <circle cx="24" cy="24" r="7" fill="none" stroke="currentColor" strokeWidth="2.4" opacity=".55" />
        </>
      );
    case "axis":
      return (
        <>
          <path d="M24 7v34M7 24h34" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
          <circle cx="24" cy="24" r="5" fill="currentColor" />
          <circle cx="24" cy="8" r="2" fill="currentColor" />
          <circle cx="40" cy="24" r="2" fill="currentColor" />
        </>
      );
    case "wave":
      return (
        <>
          <path d="M5 20c6-7 12-7 18 0s12 7 20 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.7" />
          <path d="M5 29c6-7 12-7 18 0s12 7 20 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.7" opacity=".55" />
        </>
      );
    case "core":
      return (
        <>
          <circle cx="24" cy="24" r="6" fill="currentColor" />
          <circle cx="24" cy="24" r="15" fill="none" stroke="currentColor" strokeDasharray="3 6" strokeLinecap="round" strokeWidth="2.5" />
        </>
      );
  }
}

export function UserAvatar({ avatar, className, size = "md" }: UserAvatarProps) {
  const option = getAvatar(avatar);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/[0.12] bg-bg shadow-[0_10px_30px_-16px_rgba(0,0,0,.9)]",
        SIZES[size],
        className
      )}
      style={{
        background: option.background,
        color: option.foreground,
      }}
    >
      <svg viewBox="0 0 48 48" className="h-[68%] w-[68%]" fill="none">
        <AvatarGlyph glyph={option.glyph} />
      </svg>
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,.12),inset_0_-12px_24px_rgba(0,0,0,.16)]"
      />
    </span>
  );
}
