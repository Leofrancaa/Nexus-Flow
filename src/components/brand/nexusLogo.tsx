import { cn } from "@/lib/utils";

interface NexusMarkProps {
  className?: string;
  title?: string;
}

/**
 * O encontro de duas trajetórias forma o N. O ponto lima é o estado vivo do
 * produto; os arcos externos remetem à abertura de um observatório.
 */
export function NexusMark({ className, title }: NexusMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      className={cn("shrink-0", className)}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M51.4 12.7A26 26 0 0 0 8.1 25.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".34"
      />
      <path
        d="M12.6 50.8A26 26 0 0 0 56 38.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".34"
      />
      <path
        d="M10.2 19.7a26.1 26.1 0 0 1 6.3-8"
        fill="none"
        stroke="var(--color-brand)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M16.5 43V24.3c0-3.5 4.2-5.2 6.6-2.6l17.7 19.4c2.4 2.6 6.7.9 6.7-2.6V19"
        fill="none"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="47.5" cy="19" r="3.4" fill="var(--color-brand)" />
    </svg>
  );
}

export function NexusLogo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 text-fg", className)}>
      <NexusMark className={cn("h-11 w-11", markClassName)} />
      <div className="leading-none">
        <span className="block font-display text-xl font-bold tracking-[0.16em]">
          NEXUS
        </span>
        <span className="mt-1 block text-[0.58rem] font-semibold uppercase tracking-[0.24em] text-fg/45">
          Finanças pessoais
        </span>
      </div>
    </div>
  );
}
