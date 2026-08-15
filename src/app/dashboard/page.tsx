// src/app/dashboard/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Layers3, Repeat2, Waves } from "lucide-react";
import { toast } from "react-hot-toast";

import { PageWrapper } from "@/components/layout/pageWrapper";
import { CategoryBreakdown } from "@/components/dashboard/categoryBreakdown";
import { DashboardHero } from "@/components/dashboard/dashboardHero";
import {
  SyncAccountsModal,
  type SyncConnection,
} from "@/components/dashboard/syncAccountsModal";
import { LimitRing } from "@/components/dashboard/limitRing";
import { RecentActivity } from "@/components/dashboard/recentActivity";
import { SpendTrendCard } from "@/components/dashboard/spendTrendCard";
import { WidgetCard } from "@/components/dashboard/widgetCard";
import { CreditOverviewModal } from "@/components/dashboard/creditOverviewModal";
import { Money } from "@/components/ui/money";
import { PrivacyProvider } from "@/contexts/privacyContext";
import { useDataChanged } from "@/hooks/useDataRefresh";
import { apiRequest } from "@/lib/auth";
import { toActivities, type Activity } from "@/lib/activities";
import { gastoAcumuladoPorDia } from "@/lib/spendTrend";
import type { DashboardData } from "@/server/types/index";

type PluggyRefreshResult = {
  synchronized?: boolean;
  requiresUserInput?: boolean;
  refreshLimited?: boolean;
};

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
  const [sincronizando, setSincronizando] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [connections, setConnections] = useState<SyncConnection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [busyConnectionId, setBusyConnectionId] = useState<string | null>(null);
  const [progressoSincronizacao, setProgressoSincronizacao] = useState<{
    atual: number;
    total: number;
  } | null>(null);

  const recarregar = useCallback(() => setRefreshKey((k) => k + 1), []);
  // O lançamento manual vive no FAB, no layout — o aviso de "criei algo"
  // chega por evento, não por prop.
  useDataChanged(recarregar);

  const carregarConexoes = useCallback(async () => {
    setConnectionsLoading(true);
    try {
      const response = await apiRequest("/api/pluggy/items");
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Não foi possível carregar as contas.");
      const loaded = (body.data ?? []) as SyncConnection[];
      setConnections(loaded);
      return loaded;
    } finally {
      setConnectionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!syncModalOpen) return;
    carregarConexoes().catch((error) =>
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar as contas.")
    );
  }, [carregarConexoes, syncModalOpen]);

  const sincronizarTodasAsContas = useCallback(async () => {
    if (sincronizando) return;

    setSincronizando(true);
    const toastId = toast.loading("Localizando suas contas conectadas…");

    try {
      const availableConnections = connections.length > 0 ? connections : await carregarConexoes();
      if (availableConnections.length === 0) {
        toast.error("Nenhuma instituição conectada.", { id: toastId });
        return;
      }

      setProgressoSincronizacao({ atual: 0, total: availableConnections.length });
      let atualizadas = 0;
      let pendentes = 0;
      let precisamReconectar = 0;
      let falhas = 0;

      // Uma chamada por vez evita disputar a coleta entre instituições e ainda
      // entrega a experiência de sincronizar tudo com um único toque.
      for (const [index, connection] of availableConnections.entries()) {
        setProgressoSincronizacao({ atual: index + 1, total: availableConnections.length });
        toast.loading(
          `Atualizando ${connection.connectorName || "instituição"} (${index + 1}/${availableConnections.length})…`,
          { id: toastId }
        );

        try {
          const response = await apiRequest(`/api/pluggy/items/${connection.id}/sync`, {
            method: "POST",
          });
          const body = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(body.error || "Falha na atualização.");

          const result = (body.data ?? {}) as PluggyRefreshResult;
          if (result.requiresUserInput) precisamReconectar += 1;
          else if (result.synchronized || result.refreshLimited) atualizadas += 1;
          else pendentes += 1;
        } catch {
          falhas += 1;
        }
      }

      recarregar();

      await carregarConexoes().catch(() => undefined);

      if (falhas === availableConnections.length) {
        toast.error("Nenhuma instituição conseguiu atualizar agora.", { id: toastId });
      } else if (precisamReconectar > 0) {
        toast.error(
          `${atualizadas} atualizada(s). ${precisamReconectar} precisa(m) ser reconectada(s) no Open Finance.`,
          { id: toastId }
        );
      } else if (pendentes > 0) {
        toast.success(
          `${atualizadas} atualizada(s). ${pendentes} continua(m) processando em segundo plano.`,
          { id: toastId }
        );
      } else if (falhas > 0) {
        toast.success(`${atualizadas} atualizada(s); ${falhas} falhou(aram).`, { id: toastId });
      } else {
        toast.success(`${atualizadas} instituição(ões) sincronizada(s).`, { id: toastId });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao sincronizar as contas.", {
        id: toastId,
      });
    } finally {
      setSincronizando(false);
      setProgressoSincronizacao(null);
    }
  }, [carregarConexoes, connections, recarregar, sincronizando]);

  const sincronizarUmaConta = useCallback(
    async (connection: SyncConnection) => {
      if (sincronizando || busyConnectionId) return;

      setBusyConnectionId(connection.id);
      const toastId = toast.loading(`Atualizando ${connection.connectorName || "instituição"}…`);
      try {
        const response = await apiRequest(`/api/pluggy/items/${connection.id}/sync`, {
          method: "POST",
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || "Falha na atualização.");

        const result = (body.data ?? {}) as PluggyRefreshResult;
        if (result.requiresUserInput) {
          toast.error("O banco pediu uma nova autorização. Abra Gerenciar contas para reconectar.", {
            id: toastId,
          });
        } else if (result.synchronized || result.refreshLimited) {
          toast.success(`${connection.connectorName || "Instituição"} atualizada.`, { id: toastId });
        } else {
          toast.success("Atualização iniciada e processando em segundo plano.", { id: toastId });
        }

        recarregar();
        await carregarConexoes();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Falha ao sincronizar.", {
          id: toastId,
        });
      } finally {
        setBusyConnectionId(null);
      }
    },
    [busyConnectionId, carregarConexoes, recarregar, sincronizando]
  );

  useEffect(() => {
    let cancelado = false;

    const carregar = async () => {
      const agora = new Date();
      const query = `mes=${agora.getMonth() + 1}&ano=${agora.getFullYear()}`;

      try {
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
    const disponivel = lista.reduce(
      (soma, c) => soma + Number(c.limite_disponivel),
      0
    );
    return {
      quantidade: lista.length,
      limite,
      gasto,
      disponivel,
      consumo: limite > 0 ? Math.max(limite - disponivel, 0) / limite : 0,
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
        saldoOrigem={dados?.saldoOrigem ?? "lancamentos"}
        entradas={receitasMes}
        saidas={despesasMes}
        carregando={carregando}
        sincronizando={sincronizando}
        progressoSincronizacao={progressoSincronizacao}
        onAbrirSincronizacao={() => setSyncModalOpen(true)}
      />

      <SyncAccountsModal
        open={syncModalOpen}
        onOpenChange={setSyncModalOpen}
        connections={connections}
        loading={connectionsLoading}
        syncingAll={sincronizando}
        busyId={busyConnectionId}
        progress={progressoSincronizacao}
        onSyncAll={sincronizarTodasAsContas}
        onSyncOne={sincronizarUmaConta}
      />

      <CreditOverviewModal
        open={creditModalOpen}
        onOpenChange={setCreditModalOpen}
        cards={dados?.cartoesAVencer ?? []}
        onSync={() => {
          setCreditModalOpen(false);
          setSyncModalOpen(true);
        }}
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
              label="Assinaturas"
              value={<Money value={Number(dados?.assinaturas?.total ?? 0)} />}
              sub={`${dados?.assinaturas?.quantidade ?? 0} ${dados?.assinaturas?.quantidade === 1 ? "assinatura" : "assinaturas"}`}
              href="/categorias/gastos"
              delay={120}
              media={
                <MetricIcon>
                  <Repeat2 className="h-4 w-4" aria-hidden="true" />
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
                  "Toque para sincronizar"
                )
              }
              onClick={
                cartoes.quantidade > 0
                  ? () => setCreditModalOpen(true)
                  : () => setSyncModalOpen(true)
              }
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
              delay={240}
              media={
                <MetricIcon>
                  <Layers3 className="h-4 w-4" aria-hidden="true" />
                </MetricIcon>
              }
            />

            <WidgetCard
              label="Saldo no fim do mês"
              value={<Money value={Number(dados?.saldoFuturo ?? 0)} />}
              sub={
                dados?.saldoOrigem === "contas"
                  ? "Saldo conectado + lançamentos futuros do mês"
                  : "Lançamentos até o fim deste mês"
              }
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

