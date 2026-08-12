"use client";

import Link from "next/link";
import { ChevronRight, PieChart } from "lucide-react";

import {
  CategoryBar,
  montarSegmentos,
  type CategorySlice,
} from "@/components/dashboard/categoryBar";
import { Money } from "@/components/ui/money";

interface CategoryBreakdownProps {
  slices: CategorySlice[];
  /** Quantas linhas de legenda antes de resumir o resto. */
  limite?: number;
}

/**
 * Para onde o dinheiro foi, este mês.
 *
 * A barra dá a proporção e a legenda dá o nome e o número — juntas respondem
 * "no que gastei" e "quanto" sem exigir um segundo toque. O percentual fica
 * ao lado do valor porque proporção é o que a pessoa compara mês a mês; o
 * valor absoluto ela já leu no topo do card.
 */
export function CategoryBreakdown({
  slices,
  limite = 4,
}: CategoryBreakdownProps) {
  const segmentos = montarSegmentos(slices);
  const total = segmentos.reduce((soma, s) => soma + s.total, 0);

  if (segmentos.length === 0) {
    return (
      <section className="rise rounded-card bg-surface p-5">
        <div className="flex items-center gap-2">
          <PieChart className="h-4 w-4 text-subtle" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-fg">
            Gastos por categoria
          </h2>
        </div>
        <p className="mt-2 text-sm text-muted">
          Nenhum gasto registrado este mês.
        </p>
        <p className="mt-1 text-xs text-subtle">
          Assim que houver lançamentos, a divisão aparece aqui.
        </p>
      </section>
    );
  }

  const naLegenda = segmentos.slice(0, limite);
  const ocultas = segmentos.length - naLegenda.length;

  return (
    <section className="rise rounded-card bg-surface p-5">
      <Link
        href="/categorias"
        className="group flex items-start justify-between gap-2"
      >
        <div className="min-w-0">
          <h2 className="truncate text-sm text-muted">
            Gastos por categoria <span className="text-subtle">· este mês</span>
          </h2>
          <Money
            value={total}
            className="mt-0.5 block text-3xl font-bold text-fg"
          />
        </div>
        <ChevronRight
          className="mt-1 h-4 w-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>

      <CategoryBar segments={segmentos} className="mt-4" />

      <p className="mt-2 text-right text-xs text-subtle">
        {segmentos.length} {segmentos.length === 1 ? "categoria" : "categorias"}
      </p>

      <ul className="mt-3 space-y-2.5 border-t border-line pt-3">
        {naLegenda.map((s) => (
          <li key={s.key} className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: s.cor }}
            />
            <span className="min-w-0 flex-1 truncate text-sm text-fg">
              {s.nome}
            </span>
            <Money
              value={s.total}
              className="shrink-0 text-sm font-semibold text-fg"
            />
            {/* Largura fixa para os percentuais alinharem à direita mesmo
                variando entre uma e três casas. */}
            <span className="num w-11 shrink-0 text-right text-xs text-subtle">
              {Math.round(s.fracao * 100)}%
            </span>
          </li>
        ))}
      </ul>

      {ocultas > 0 && (
        <p className="mt-3 text-xs text-subtle">
          + {ocultas} {ocultas === 1 ? "outra" : "outras"}
        </p>
      )}
    </section>
  );
}
