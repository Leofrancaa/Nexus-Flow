"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { Money } from "@/components/ui/money";

interface BalanceHeroProps {
  saldo: number;
  entradas: number;
  saidas: number;
  carregando: boolean;
}

/**
 * Saldo do mês, em cima de tudo.
 *
 * É a única pergunta que justifica abrir o app com pressa — "quanto eu tenho"
 * — então ela ocupa o maior tipo da tela e não divide espaço com mais nada.
 * Entradas e saídas ficam logo abaixo porque explicam o número sem competir
 * com ele.
 */
export function BalanceHero({
  saldo,
  entradas,
  saidas,
  carregando,
}: BalanceHeroProps) {
  if (carregando) {
    return <div className="h-[7.5rem] animate-pulse rounded-card bg-surface" />;
  }

  return (
    <section className="rise rounded-card bg-surface p-5">
      <p className="text-sm text-muted">Saldo atual</p>
      <Money
        value={saldo}
        className="mt-1 block text-4xl font-bold text-fg"
      />

      <div className="mt-4 flex items-center gap-5 border-t border-line pt-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-positive/15"
          >
            <ArrowDownLeft className="h-3.5 w-3.5 text-positive" />
          </span>
          <div className="min-w-0">
            <p className="text-[0.6875rem] text-subtle">Entradas</p>
            <Money
              value={entradas}
              className="block truncate text-sm font-bold text-fg"
            />
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-negative/15"
          >
            <ArrowUpRight className="h-3.5 w-3.5 text-negative" />
          </span>
          <div className="min-w-0">
            <p className="text-[0.6875rem] text-subtle">Saídas</p>
            <Money
              value={saidas}
              className="block truncate text-sm font-bold text-fg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
