"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { SpendTrendChart } from "@/components/dashboard/spendTrendChart";
import { Money } from "@/components/ui/money";
import { cn } from "@/lib/utils";

interface SpendTrendCardProps {
  total: number;
  /** Gasto acumulado dia a dia, do primeiro do mês até hoje. */
  serie: number[];
  /** Total do mês anterior, para a comparação. Zero desliga a legenda. */
  anterior: number;
}

/**
 * Gasto do mês, com a curva de como ele chegou até aqui.
 *
 * Ocupa a largura toda porque a inclinação é a informação: espremida em meia
 * coluna, a curva vira um risco e o ritmo do gasto — que é o ponto — se perde.
 */
export function SpendTrendCard({
  total,
  serie,
  anterior,
}: SpendTrendCardProps) {
  const delta =
    anterior > 0 ? Math.round(((total - anterior) / anterior) * 100) : null;

  return (
    <section className="rise overflow-hidden rounded-card bg-surface">
      <Link href="/atividades?tipo=saidas" className="group block p-5 pb-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm text-muted">Gastos do mês</p>
            <Money
              value={total}
              className="mt-0.5 block text-3xl font-bold text-fg"
            />
          </div>
          <ChevronRight
            className="mt-1 h-4 w-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </div>

        {delta !== null && (
          <p
            className={cn(
              "mt-1 text-xs",
              delta > 0 ? "text-negative" : "text-positive"
            )}
          >
            {delta === 0
              ? "Igual ao mês passado"
              : `${delta > 0 ? "↑" : "↓"} ${Math.abs(delta)}% vs. mês passado`}
          </p>
        )}
      </Link>

      {/* A curva sangra até a borda inferior do card — o gradiente morre no
          fundo da superfície, então cortar antes só criaria uma faixa vazia.
          A margem à direita reserva o espaço do ponto final. */}
      <div className="mt-4 pr-3">
        <SpendTrendChart values={serie} className="h-28 w-full" />
      </div>
    </section>
  );
}
