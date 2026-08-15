"use client";

import { CalendarClock, CreditCard, RefreshCw } from "lucide-react";

import { Money } from "@/components/ui/money";
import { Modal } from "@/components/ui/modal";
import type { DueCard } from "@/server/types/index";

interface CreditOverviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cards: DueCard[];
  onSync: () => void;
}

function dateLabel(value: string | null, fallbackDay: number): string {
  if (!value) return `Vence todo dia ${fallbackDay}`;
  const [year, month, day] = value.split("-").map(Number);
  return `Vence ${new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  })}`;
}

function lastDigits(number: string): string {
  const digits = number.replace(/\D/g, "");
  return digits.length >= 4 ? digits.slice(-4) : number;
}

export function CreditOverviewModal({
  open,
  onOpenChange,
  cards,
  onSync,
}: CreditOverviewModalProps) {
  const totalInvoice = cards.reduce((sum, card) => sum + Number(card.total_gasto), 0);
  const totalAvailable = cards.reduce((sum, card) => sum + Number(card.limite_disponivel), 0);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Crédito e faturas"
      description="Limites e fatura atual de cada cartão conectado."
      className="sm:max-w-md"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-elevated px-4 py-3">
          <p className="text-xs text-muted">Faturas atuais</p>
          <Money value={totalInvoice} className="mt-1 block text-lg font-bold text-fg" />
        </div>
        <div className="rounded-2xl bg-elevated px-4 py-3">
          <p className="text-xs text-muted">Limite disponível</p>
          <Money value={totalAvailable} className="mt-1 block text-lg font-bold text-brand" />
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {cards.map((card) => {
          const limit = Number(card.limite);
          const available = Number(card.limite_disponivel);
          const usedRatio = limit > 0 ? Math.min(Math.max((limit - available) / limit, 0), 1) : 0;

          return (
            <li
              key={card.id}
              className="rounded-2xl border border-white/[0.06] bg-elevated/65 p-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface text-brand">
                  <CreditCard className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base font-bold text-fg">{card.nome}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {[card.instituicao, card.bandeira, `•••• ${lastDigits(card.numero)}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs text-muted">Fatura atual</p>
                  <Money value={Number(card.total_gasto)} className="mt-0.5 block text-lg font-bold text-fg" />
                </div>
                <p className="flex items-center gap-1 text-xs text-subtle">
                  <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                  {dateLabel(card.vencimento_em, card.dia_vencimento)}
                </p>
              </div>

              {limit > 0 ? (
                <div className="mt-3">
                  <div className="mb-1.5 flex justify-between text-[11px] text-subtle">
                    <span>{Math.round(usedRatio * 100)}% usado</span>
                    <span><Money value={available} /> livres</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${usedRatio * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs text-warning">A instituição ainda não informou o limite deste cartão.</p>
              )}
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={onSync}
        className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line px-4 font-semibold text-fg transition-[background-color,transform] hover:bg-elevated active:scale-[.98]"
      >
        <RefreshCw className="h-4 w-4 text-brand" aria-hidden="true" />
        Atualizar dados dos cartões
      </button>
    </Modal>
  );
}
