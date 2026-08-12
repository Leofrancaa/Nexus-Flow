import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface WidgetCardProps {
  label: string;
  /** Destaque do card — string curta ou <Money>. */
  value: React.ReactNode;
  /**
   * Linha de contexto abaixo do valor: "4 assinaturas", "Vence dia 17".
   * Aceita nó para poder conter <Money> e continuar obedecendo o modo oculto.
   */
  sub?: React.ReactNode;
  /** Anel, gráfico ou ícone no topo do card. */
  media?: React.ReactNode;
  href?: string;
  /** Atraso da entrada, em ms, para a cascata da tela. */
  delay?: number;
  className?: string;
}

/**
 * Bloco de métrica do painel.
 *
 * Anatomia fixa — mídia no topo, rótulo/valor embaixo — porque a régua comum
 * é o que faz quatro cards diferentes lerem como uma grade só. O valor vem
 * depois do rótulo no DOM, na ordem em que se lê; o tamanho é que cria a
 * hierarquia, não a posição.
 */
export function WidgetCard({
  label,
  value,
  sub,
  media,
  href,
  delay = 0,
  className,
}: WidgetCardProps) {
  const conteudo = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-h-[2rem]">{media}</div>
        {href && (
          <ChevronRight
            className="h-4 w-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        )}
      </div>

      <div className="mt-auto pt-4">
        <p className="truncate text-sm text-muted">{label}</p>
        <p className="mt-0.5 truncate text-xl font-bold text-fg">{value}</p>
        {sub && <p className="mt-0.5 truncate text-xs text-subtle">{sub}</p>}
      </div>
    </>
  );

  const estilo = cn(
    "rise group flex h-full min-h-[8.75rem] flex-col rounded-card border border-white/[0.045] bg-[linear-gradient(145deg,#17191d_0%,#121417_100%)] p-4",
    "transition-[background-color,transform,border-color] duration-200 active:scale-[.985]",
    href && "hover:border-white/[0.08] hover:bg-elevated",
    className
  );

  if (href) {
    return (
      <Link
        href={href}
        className={estilo}
        style={{ animationDelay: `${delay}ms` }}
      >
        {conteudo}
      </Link>
    );
  }

  return (
    <div className={estilo} style={{ animationDelay: `${delay}ms` }}>
      {conteudo}
    </div>
  );
}
