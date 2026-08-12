"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Money } from "@/components/ui/money";
import { cn } from "@/lib/utils";
import { iniciais, tituloDoDia, type Activity } from "@/lib/activities";

interface RecentActivityProps {
  itens: Activity[] | null;
  /** Quantas linhas mostrar antes de mandar para a tela cheia. */
  limite?: number;
}

/**
 * Prévia do extrato.
 *
 * O painel não repete a tela de Atividades: mostra só o suficiente para a
 * pessoa reconhecer o último gasto e decidir se vale abrir a lista inteira.
 */
export function RecentActivity({ itens, limite = 4 }: RecentActivityProps) {
  if (itens === null) {
    return (
      <section aria-busy="true">
        <div className="mb-2 h-4 w-40 animate-pulse rounded bg-surface" />
        <div className="space-y-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      </section>
    );
  }

  if (itens.length === 0) {
    return (
      <section className="rounded-card bg-surface p-6 text-center">
        <p className="text-sm text-muted">Nenhum lançamento este mês.</p>
        <p className="mt-1 text-xs text-subtle">
          Toque no + para registrar o primeiro.
        </p>
      </section>
    );
  }

  const recentes = itens.slice(0, limite);

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-fg">Atividade recente</h2>
        <Link
          href="/atividades"
          className="group flex items-center gap-0.5 text-xs font-semibold text-muted transition-colors hover:text-fg"
        >
          Ver tudo
          <ChevronRight
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>

      <ul className="overflow-hidden rounded-card bg-surface">
        {recentes.map((item, i) => (
          <li key={item.key}>
            <Link
              href="/atividades"
              className={cn(
                "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-elevated",
                i > 0 && "border-t border-line"
              )}
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-bold"
                style={{
                  backgroundColor: `${item.cor ?? "#a1a1aa"}22`,
                  color: item.cor ?? "#a1a1aa",
                }}
              >
                {iniciais(item)}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-fg">
                  {item.descricao}
                </span>
                <span className="block truncate text-xs text-subtle">
                  {tituloDoDia(item.data)}
                  {item.categoria ? ` · ${item.categoria}` : ""}
                </span>
              </span>

              <Money
                value={item.valor}
                sign={item.kind === "income" ? "+" : "−"}
                className={cn(
                  "shrink-0 text-sm font-bold",
                  item.kind === "income" ? "text-positive" : "text-negative"
                )}
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
