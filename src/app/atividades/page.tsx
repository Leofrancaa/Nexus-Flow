"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Pencil, Search, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";

import { PageWrapper } from "@/components/layout/pageWrapper";
import { Modal } from "@/components/ui/modal";
import ConfirmDialog from "@/components/ui/confirmDialog";
import { EditExpenseModal } from "@/components/modals/editExpenseModal";
import { EditIncomeModal } from "@/components/modals/editIncomeModal";
import { TransactionIcon } from "@/components/activities/transactionIcon";
import { useDate } from "@/contexts/dateContext";
import { useDataChanged } from "@/hooks/useDataRefresh";
import { apiRequest } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  toActivities,
  tituloDoDia,
  type Activity,
} from "@/lib/activities";

type Filtro = "todas" | "entradas" | "saidas";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function AtividadesPage() {
  return (
    // useSearchParams obriga um limite de Suspense para o build não falhar na
    // pré-renderização da rota.
    <Suspense fallback={null}>
      <Atividades />
    </Suspense>
  );
}

function Atividades() {
  const searchParams = useSearchParams();
  const { selectedMonth, selectedYear, setMonth, setYear } = useDate();

  // `/despesas` e `/receitas` agora caem aqui com o filtro já aplicado.
  const filtroInicial = (() => {
    const tipo = searchParams.get("tipo");
    return tipo === "entradas" || tipo === "saidas" ? tipo : "todas";
  })();

  const [filtro, setFiltro] = useState<Filtro>(filtroInicial);
  const [busca, setBusca] = useState("");
  const [itens, setItens] = useState<Activity[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selecionada, setSelecionada] = useState<Activity | null>(null);
  const [editando, setEditando] = useState<Activity | null>(null);
  const [confirmando, setConfirmando] = useState<Activity | null>(null);

  const recarregar = useCallback(() => setRefreshKey((k) => k + 1), []);
  useDataChanged(recarregar);

  useEffect(() => {
    let cancelado = false;

    const carregar = async () => {
      setItens(null);
      try {
        const query = `mes=${selectedMonth}&ano=${selectedYear}`;
        const [resDespesas, resReceitas] = await Promise.all([
          apiRequest(`/api/expenses?${query}`),
          apiRequest(`/api/incomes?${query}`),
        ]);

        const despesas = resDespesas.ok
          ? ((await resDespesas.json()).data ?? [])
          : [];
        const receitas = resReceitas.ok
          ? ((await resReceitas.json()).data ?? [])
          : [];

        if (cancelado) return;

        setItens(toActivities(despesas, receitas));
      } catch {
        if (!cancelado) {
          setItens([]);
          toast.error("Não foi possível carregar as atividades.");
        }
      }
    };

    carregar();
    return () => {
      cancelado = true;
    };
  }, [selectedMonth, selectedYear, refreshKey]);

  const filtradas = useMemo(() => {
    if (!itens) return null;
    const termo = busca.trim().toLowerCase();

    return itens.filter((item) => {
      if (filtro === "entradas" && item.kind !== "income") return false;
      if (filtro === "saidas" && item.kind !== "expense") return false;
      if (!termo) return true;
      return (
        item.descricao.toLowerCase().includes(termo) ||
        (item.categoria?.toLowerCase().includes(termo) ?? false) ||
        (item.instituicao?.toLowerCase().includes(termo) ?? false)
      );
    });
  }, [itens, filtro, busca]);

  const grupos = useMemo(() => {
    if (!filtradas) return null;
    const mapa = new Map<string, Activity[]>();
    for (const item of filtradas) {
      const atual = mapa.get(item.data);
      if (atual) atual.push(item);
      else mapa.set(item.data, [item]);
    }
    return [...mapa.entries()];
  }, [filtradas]);

  const totais = useMemo(() => {
    const base = { entradas: 0, saidas: 0 };
    for (const item of itens ?? []) {
      if (item.kind === "income") base.entradas += item.valor;
      else base.saidas += item.valor;
    }
    return base;
  }, [itens]);

  const mudarMes = (passo: number) => {
    const alvo = selectedMonth + passo;
    if (alvo < 1) {
      setMonth(12);
      setYear(selectedYear - 1);
    } else if (alvo > 12) {
      setMonth(1);
      setYear(selectedYear + 1);
    } else {
      setMonth(alvo);
    }
  };

  const excluir = async (item: Activity) => {
    const rota = item.kind === "expense" ? "expenses" : "incomes";
    const toastId = toast.loading("Excluindo...");
    try {
      const res = await apiRequest(`/api/${rota}/${item.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const erro = await res.json().catch(() => ({}));
        throw new Error(erro.error || "Erro ao excluir.");
      }
      toast.success("Lançamento excluído.", { id: toastId });
      recarregar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir.", {
        id: toastId,
      });
    }
  };

  // Despesa de cartão de crédito é gerada pela fatura: editar aqui deixaria o
  // limite do cartão inconsistente. Mesma regra que a lista antiga aplicava.
  const podeEditar = (item: Activity) =>
    item.kind === "income" || item.expense?.metodo_pagamento !== "cartao de credito";

  return (
    <PageWrapper className="pt-8">
      <header className="mb-5">
        <h1 className="font-display text-2xl font-bold tracking-tight text-fg">
          Atividades
        </h1>

        <div className="mt-3 flex items-center justify-between rounded-2xl bg-surface px-2 py-2">
          <button
            type="button"
            onClick={() => mudarMes(-1)}
            aria-label="Mês anterior"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-elevated hover:text-fg"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-fg">
            {MESES[selectedMonth - 1]} {selectedYear}
          </span>
          <button
            type="button"
            onClick={() => mudarMes(1)}
            aria-label="Próximo mês"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-elevated hover:text-fg"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-surface px-4 py-3">
            <p className="text-xs text-muted">Entradas</p>
            <p className="num mt-0.5 text-lg font-bold text-positive">
              {brl(totais.entradas)}
            </p>
          </div>
          <div className="rounded-2xl bg-surface px-4 py-3">
            <p className="text-xs text-muted">Saídas</p>
            <p className="num mt-0.5 text-lg font-bold text-negative">
              {brl(totais.saidas)}
            </p>
          </div>
        </div>
      </header>

      <div className="mb-4 flex gap-2" role="group" aria-label="Filtrar por tipo">
        {(
          [
            ["todas", "Todas"],
            ["entradas", "Entradas"],
            ["saidas", "Saídas"],
          ] as const
        ).map(([valor, rotulo]) => (
          <button
            key={valor}
            type="button"
            onClick={() => setFiltro(valor)}
            aria-pressed={filtro === valor}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              filtro === valor
                ? "bg-brand text-bg glow-sm"
                : "bg-surface text-muted hover:text-fg"
            )}
          >
            {rotulo}
          </button>
        ))}
      </div>

      <div className="mb-5 flex items-center gap-2 rounded-2xl bg-surface px-4">
        <Search className="h-4 w-4 shrink-0 text-subtle" aria-hidden="true" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar lançamento"
          aria-label="Buscar lançamento"
          className="w-full bg-transparent py-3 text-base text-fg outline-none placeholder:text-subtle"
        />
      </div>

      {grupos === null ? (
        <div className="space-y-3" aria-live="polite" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      ) : grupos.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">
          Nenhum lançamento
          {filtro === "entradas"
            ? " de entrada"
            : filtro === "saidas"
              ? " de saída"
              : ""}{" "}
          em {MESES[selectedMonth - 1].toLowerCase()}.
        </p>
      ) : (
        <div className="space-y-6">
          {grupos.map(([dia, doDia]) => (
            <section key={dia}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-subtle">
                {tituloDoDia(dia)}
              </h2>
              <ul className="space-y-1">
                {doDia.map((item) => (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => setSelecionada(item)}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-surface"
                    >
                      <TransactionIcon
                        description={item.descricao}
                        category={item.categoria}
                        color={item.cor}
                        connectorId={item.instituicaoId}
                        institution={item.instituicao}
                      />

                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-fg">
                          {item.descricao}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {item.categoria ?? "Sem categoria"}
                          {item.detalhe ? ` · ${item.detalhe}` : ""}
                        </span>
                        {item.instituicao ? (
                          <span className="mt-0.5 block truncate text-[11px] font-medium text-subtle">
                            {item.instituicao}
                          </span>
                        ) : null}
                      </span>

                      <span
                        className={cn(
                          "num shrink-0 text-sm font-bold",
                          item.kind === "income"
                            ? "text-positive"
                            : "text-negative"
                        )}
                      >
                        {item.kind === "income" ? "+" : "−"}
                        {brl(item.valor)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* Ações do lançamento — folha de baixo, ao alcance do polegar. */}
      <Modal
        open={selecionada !== null}
        onOpenChange={(v) => !v && setSelecionada(null)}
        title={selecionada?.descricao ?? ""}
        description={
          selecionada
            ? `${selecionada.kind === "income" ? "Receita" : "Despesa"} de ${brl(
                selecionada.valor
              )}`
            : undefined
        }
        size="sm"
      >
        <div className="flex flex-col gap-2 pb-2">
          {selecionada && podeEditar(selecionada) ? (
            <button
              type="button"
              onClick={() => {
                setEditando(selecionada);
                setSelecionada(null);
              }}
              className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-left font-medium text-fg transition-colors hover:bg-elevated"
            >
              <Pencil className="h-4 w-4 text-muted" aria-hidden="true" />
              Editar
            </button>
          ) : (
            <p className="rounded-xl bg-elevated px-4 py-3 text-sm text-muted">
              Despesas de cartão de crédito são editadas pela fatura do cartão.
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              setConfirmando(selecionada);
              setSelecionada(null);
            }}
            className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-left font-medium text-negative transition-colors hover:bg-negative/10"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Excluir
          </button>
        </div>
      </Modal>

      {editando?.expense && (
        <EditExpenseModal
          expense={editando.expense}
          onClose={() => setEditando(null)}
          onUpdated={() => {
            setEditando(null);
            recarregar();
          }}
        />
      )}

      {editando?.income && (
        <EditIncomeModal
          income={editando.income}
          onClose={() => setEditando(null)}
          onUpdated={() => {
            setEditando(null);
            recarregar();
          }}
        />
      )}

      {confirmando && (
        <ConfirmDialog
          open
          onOpenChange={(aberto) => !aberto && setConfirmando(null)}
          onCancel={() => setConfirmando(null)}
          onConfirm={() => {
            excluir(confirmando);
            setConfirmando(null);
          }}
        />
      )}
    </PageWrapper>
  );
}
