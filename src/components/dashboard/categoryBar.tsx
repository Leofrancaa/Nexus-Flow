import { cn } from "@/lib/utils";

export interface CategorySlice {
  id: number;
  nome: string;
  total: number;
}

export interface CategorySegment {
  key: string;
  nome: string;
  total: number;
  cor: string;
  /** Participação no total, de 0 a 1. */
  fracao: number;
}

/** Rodízio de fallback do design system, na ordem declarada em globals.css. */
const SERIE = [
  "var(--color-cat-1)",
  "var(--color-cat-2)",
  "var(--color-cat-3)",
  "var(--color-cat-4)",
  "var(--color-cat-5)",
  "var(--color-cat-6)",
];

/** Fatias menores que isso viram um traço ilegível — vão para "Outras". */
const PISO = 0.04;

/**
 * Ordena, corta o rabo e atribui cor.
 *
 * Vive fora dos componentes porque a barra e a legenda precisam chegar
 * exatamente à mesma lista: se cada uma calculasse a sua, a terceira fatia
 * poderia ser laranja em cima e rosa embaixo.
 */
export function montarSegmentos(slices: CategorySlice[]): CategorySegment[] {
  const total = slices.reduce((soma, s) => soma + s.total, 0);
  if (total <= 0) return [];

  const ordenadas = [...slices].sort((a, b) => b.total - a.total);
  const visiveis = ordenadas.filter((s) => s.total / total >= PISO);
  const resto = total - visiveis.reduce((soma, s) => soma + s.total, 0);

  const segmentos: CategorySegment[] = visiveis.map((s, i) => ({
    key: `cat-${s.id}`,
    nome: s.nome,
    total: s.total,
    cor: SERIE[i % SERIE.length],
    fracao: s.total / total,
  }));

  if (resto > 0) {
    segmentos.push({
      key: "outras",
      nome: "Outras",
      total: resto,
      cor: "var(--color-subtle)",
      fracao: resto / total,
    });
  }

  return segmentos;
}

interface CategoryBarProps {
  segments: CategorySegment[];
  className?: string;
}

/**
 * Composição do gasto do mês em uma barra só.
 *
 * Uma barra empilhada responde "no que eu gastei" em um relance, o que uma
 * pizza com legenda só entrega depois de duas fixações do olho.
 */
export function CategoryBar({ segments, className }: CategoryBarProps) {
  if (segments.length === 0) return null;

  return (
    <div className={cn("flex h-3.5 gap-1", className)}>
      {segments.map((s) => (
        <div
          key={s.key}
          className="h-full rounded-full"
          style={{
            width: `${s.fracao * 100}%`,
            backgroundColor: s.cor,
          }}
          title={s.nome}
        />
      ))}
    </div>
  );
}
