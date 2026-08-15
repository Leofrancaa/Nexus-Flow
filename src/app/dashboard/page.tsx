// src/app/dashboard/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CreditCard, Layers3, Waves } from "lucide-react";
import { toast } from "react-hot-toast";

import { PageWrapper } from "@/components/layout/pageWrapper";
import { CategoryBreakdown } from "@/components/dashboard/categoryBreakdown";
import { DashboardHero } from "@/components/dashboard/dashboardHero";
import { LimitRing } from "@/components/dashboard/limitRing";
import { RecentActivity } from "@/components/dashboard/recentActivity";
import { SpendTrendCard } from "@/components/dashboard/spendTrendCard";
import { WidgetCard } from "@/components/dashboard/widgetCard";
import { Money } from "@/components/ui/money";
import { PrivacyProvider } from "@/contexts/privacyContext";
import { useDataChanged } from "@/hooks/useDataRefresh";
import { apiRequest } from "@/lib/auth";
import { toActivities, type Activity } from "@/lib/activities";
import { gastoAcumuladoPorDia } from "@/lib/spendTrend";
import type { DashboardData } from "@/server/types/index";

/**
 * Painel — a tela de relance.
 *
 * Responde a três perguntas em ordem de urgência: quanto eu tenho, para onde
 * o dinheiro foi, e o que está por vencer. Nada aqui pede configuração prévia
 * para valer alguma coisa: cada bloco ou mostra um número real ou some.
 *
 * O mês é sempre o corrente e não há seletor. Navegar no tempo é a função da
 * tela de Atividades; misturar as duas transformaria o painel numa planilha.
 */
export default function DashboardPage() {
  return (
    <PrivacyProvider>
      <Dashboard />
    </PrivacyProvider>
  );
}

function Dashboard() {
  const [dados, setDados] = useState<DashboardData | null>(null);
  const [itens, setItens] = useState<Activity[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const recarregar = useCallback(() => setRefreshKey((k) => k + 1), []);
  // O lançamento manual vive no FAB, no layout — o aviso de "criei algo"
  // chega por evento, não por prop.
  useDataChanged(recarregar);

  useEffect(() => {
    let cancelado = false;

    const carregar = async () => {
      const agora = new Date();
      const query = `mes=${agora.getMonth() + 1}&ano=${agora.getFullYear()}`;

      try {
        // Garante que totais, categorias e atividades sejam consultados só
        // depois de uma eventual reparação do Open Finance.
        await apiRequest("/api/pluggy/sync-stale", { method: "POST" });
        const [resPainel, resDespesas, resReceitas] = await Promise.all([
          apiRequest("/api/dashboard"),
          apiRequest(`/api/expenses?${query}`),
          apiRequest(`/api/incomes?${query}`),
        ]);

        if (cancelado) return;

        if (resPainel.ok) {
          setDados((await resPainel.json()).data ?? null);
        } else {
          setDados(null);
        }

        const despesas = resDespesas.ok
          ? ((await resDespesas.json()).data ?? [])
          : [];
        const receitas = resReceitas.ok
          ? ((await resReceitas.json()).data ?? [])
          : [];

        if (!cancelado) setItens(toActivities(despesas, receitas));
      } catch {
        if (!cancelado) {
          setItens([]);
          toast.error("Não foi possível carregar o painel.");
        }
      }
    };

    carregar();
    return () => {
      cancelado = true;
    };
  }, [refreshKey]);

  const carregando = dados === null;

  const acumulado = useMemo(
    () => gastoAcumuladoPorDia(itens ?? []),
    [itens]
  );

  // Os cartões a vencer trazem limite e gasto por cartão; o painel mostra a
  // soma, porque o que importa no relance é a folga total, não cartão a cartão.
  const cartoes = useMemo(() => {
    const lista = dados?.cartoesAVencer ?? [];
    const limite = lista.reduce((soma, c) => soma + Number(c.limite), 0);
    const gasto = lista.reduce((soma, c) => soma + Number(c.total_gasto), 0);
    const proximo = [...lista].sort(
      (a, b) => a.dia_vencimento - b.dia_vencimento
    )[0];

    return {
      quantidade: lista.length,
      limite,
      gasto,
      disponivel: Math.max(limite - gasto, 0),
      consumo: limite > 0 ? gasto / limite : 0,
      proximo,
    };
  }, [dados]);

  const categorias = dados?.gastosPorCategoria ?? [];

  const despesasMes = Number(dados?.comparativo?.despesas?.atual ?? 0);
  const despesasAnterior = Number(dados?.comparativo?.despesas?.anterior ?? 0);
  const receitasMes = Number(dados?.comparativo?.receitas?.atual ?? 0);

  return (
    <PageWrapper className="overflow-hidden">
      <DashboardHero
        saldo={Number(dados?.saldo ?? 0)}
        entradas={receitasMes}
        saidas={despesasMes}
        carregando={carregando}
      />

      <div className="relative z-10 -mt-2 space-y-4 pb-5">
        {carregando ? (
          <div className="h-56 animate-pulse rounded-card bg-surface" />
        ) : (
          <SpendTrendCard
            total={despesasMes}
            serie={acumulado}
            anterior={despesasAnterior}
          />
        )}

        {carregando ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[9.5rem] animate-pulse rounded-card bg-surface"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <WidgetCard
              label={cartoes.proximo ? "Fatura atual" : "Cartões"}
              value={
                cartoes.quantidade > 0 ? (
                  <Money value={cartoes.gasto} />
                ) : (
                  "Nenhum"
                )
              }
              sub={
                cartoes.proximo
                  ? `Vence dia ${cartoes.proximo.dia_vencimento}`
                  : "Cadastre um cartão"
              }
              href="/cartoes"
              delay={120}
              media={
                <MetricIcon>
                  <CreditCard className="h-4 w-4" aria-hidden="true" />
                </MetricIcon>
              }
            />

            <WidgetCard
              label="Limite disponível"
              value={
                cartoes.limite > 0 ? (
                  <Money value={cartoes.disponivel} />
                ) : (
                  "—"
                )
              }
              sub={
                cartoes.limite > 0 ? (
                  <>
                    de <Money value={cartoes.limite} />
                  </>
                ) : (
                  "Sem limite cadastrado"
                )
              }
              href="/cartoes"
              delay={180}
              media={
                cartoes.limite > 0 ? (
                  <LimitRing ratio={cartoes.consumo} />
                ) : null
              }
            />

            <WidgetCard
              label="Parcelamentos"
              value={String(dados?.parcelasPendentes?.length ?? 0)}
              sub="Em andamento"
              href="/cartoes"
              delay={240}
              media={
                <MetricIcon>
                  <Layers3 className="h-4 w-4" aria-hidden="true" />
                </MetricIcon>
              }
            />

            <WidgetCard
              label="Saldo previsto"
              value={<Money value={Number(dados?.saldoFuturo ?? 0)} />}
              sub="Já contando o que falta entrar e sair"
              delay={300}
              media={
                <MetricIcon>
                  <Waves className="h-4 w-4" aria-hidden="true" />
                </MetricIcon>
              }
            />
          </div>
        )}

        {!carregando && (
          <CategoryBreakdown
            slices={categorias.map((c) => ({
              id: c.id,
              nome: c.nome,
              total: Number(c.total),
            }))}
          />
        )}

        <RecentActivity itens={itens} />
      </div>
    </PageWrapper>
  );
}

function MetricIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-elevated text-muted">
      {children}
    </span>
  );
}

