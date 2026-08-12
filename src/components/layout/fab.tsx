"use client";

import { useEffect, useState } from "react";
import { Plus, TrendingDown, TrendingUp } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { NewExpenseForm } from "@/components/forms/newExpenseForm";
import { NewIncomeForm } from "@/components/forms/newIncomeForm";
import { emitDataChanged } from "@/hooks/useDataRefresh";
import { cn } from "@/lib/utils";

type Sheet = "despesa" | "receita" | null;

/**
 * Botão flutuante de lançamento manual.
 *
 * Um toque abre duas opções acima do botão, em vez de assumir "despesa" —
 * receita é lançamento raro, mas quando acontece o usuário não deveria ter
 * que procurar. Fechado, ocupa um alvo de 56px alinhado à direita da coluna
 * de conteúdo e logo acima da bottom nav.
 */
export function Fab() {
  const [expanded, setExpanded] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);

  // Esc fecha o leque — sem isto, só o toque no scrim fecharia.
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  const open = (kind: Exclude<Sheet, null>) => {
    setExpanded(false);
    setSheet(kind);
  };

  const handleCreated = () => {
    setSheet(null);
    emitDataChanged();
  };

  return (
    <>
      {expanded && (
        <button
          type="button"
          aria-label="Fechar ações"
          onClick={() => setExpanded(false)}
          className="fixed inset-0 z-40 bg-[#030406]/72 backdrop-blur-[5px] motion-safe:animate-[nx-overlay-in_180ms_ease-out_both]"
        />
      )}

      <div className="pointer-events-none fixed inset-x-0 bottom-nav z-40 mx-auto flex max-w-[430px] flex-col items-end gap-3 px-5 pb-3">
        {expanded && (
          <div className="pointer-events-auto flex flex-col items-end gap-2">
            <FabAction
              label="Nova receita"
              icon={TrendingUp}
              tone="positive"
              delay={0}
              onClick={() => open("receita")}
            />
            <FabAction
              label="Nova despesa"
              icon={TrendingDown}
              tone="negative"
              delay={60}
              onClick={() => open("despesa")}
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? "Fechar ações" : "Novo lançamento"}
          className="pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full border border-brand/60 bg-brand text-bg transition-[transform,box-shadow,opacity] duration-200 glow hover:opacity-90 active:scale-95"
        >
          <Plus
            className={cn(
              "h-6 w-6 transition-transform duration-200",
              expanded && "rotate-45"
            )}
            strokeWidth={2.5}
          />
        </button>
      </div>

      <Modal
        open={sheet === "despesa"}
        onOpenChange={(v) => !v && setSheet(null)}
        title="Nova Despesa"
        size="lg"
      >
        <NewExpenseForm
          onClose={() => setSheet(null)}
          onCreated={handleCreated}
        />
      </Modal>

      <Modal
        open={sheet === "receita"}
        onOpenChange={(v) => !v && setSheet(null)}
        title="Nova Receita"
        size="lg"
      >
        <NewIncomeForm
          onClose={() => setSheet(null)}
          onCreated={handleCreated}
        />
      </Modal>
    </>
  );
}

function FabAction({
  label,
  icon: Icon,
  tone,
  delay,
  onClick,
}: {
  label: string;
  icon: typeof TrendingUp;
  tone: "positive" | "negative";
  delay: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className="rise flex items-center gap-3 rounded-full border border-white/[0.07] bg-[linear-gradient(145deg,#1b1e22_0%,#121417_100%)] py-2.5 pl-4 pr-3 text-sm font-semibold text-fg shadow-[0_18px_42px_rgba(0,0,0,.4)] transition-transform active:scale-[.98]"
    >
      {label}
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full",
          tone === "positive"
            ? "bg-positive/15 text-positive"
            : "bg-negative/15 text-negative"
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
    </button>
  );
}
