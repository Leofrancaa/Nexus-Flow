"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownLeft,
  Building2,
  ChevronLeft,
  Link2,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Unplug,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import type { Item } from "pluggy-js";
import { PageWrapper } from "@/components/layout/pageWrapper";
import ConfirmDialog from "@/components/ui/confirmDialog";
import Button from "@/components/ui/button";
import { InstitutionLogo } from "@/components/activities/transactionIcon";
import { apiRequest } from "@/lib/auth";

const PluggyConnect = dynamic(
  () => import("react-pluggy-connect").then((module) => module.PluggyConnect),
  { ssr: false }
);

type Connection = {
  id: string;
  connectorId: number | null;
  connectorName: string | null;
  status: string;
  lastSyncedAt: string | null;
  accountCount: number;
  balance: string;
};

type ConnectSession = {
  accessToken: string;
  includeSandbox: boolean;
  itemId?: string;
};

const STATUS_LABELS: Record<string, string> = {
  UPDATED: "Atualizada",
  UPDATING: "Sincronizando",
  WAITING_USER_INPUT: "Ação necessária",
  WAITING_USER_ACTION: "Aguardando banco",
  LOGIN_ERROR: "Reconecte a conta",
  OUTDATED: "Atualização pendente",
};

function money(value: string) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function OpenFinancePage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [session, setSession] = useState<ConnectSession | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);

  const loadConnections = useCallback(async () => {
    const response = await apiRequest("/api/pluggy/items");
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Não foi possível carregar as conexões.");
    setConnections(body.data ?? []);
  }, []);

  useEffect(() => {
    loadConnections()
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, [loadConnections]);

  const openConnect = async (itemId?: string) => {
    const toastId = toast.loading(itemId ? "Preparando reconexão..." : "Abrindo ambiente seguro...");
    try {
      const response = await apiRequest("/api/pluggy/connect-token", {
        method: "POST",
        body: JSON.stringify(itemId ? { itemId } : {}),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Não foi possível iniciar a conexão.");
      setSession({ ...body.data, itemId });
      toast.dismiss(toastId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao abrir a conexão.", { id: toastId });
    }
  };

  const handleSuccess = async ({ item }: { item: Item }) => {
    setSession(null);
    const toastId = toast.loading("Importando saldos e transações...");
    try {
      const response = await apiRequest("/api/pluggy/items", {
        method: "POST",
        body: JSON.stringify({ itemId: item.id }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "A conta conectou, mas a importação falhou.");
      await loadConnections();
      toast.success("Conta conectada e sincronizada.", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao importar os dados.", { id: toastId });
    }
  };

  const sync = async (itemId: string) => {
    setBusyId(itemId);
    const toastId = toast.loading("Buscando os dados mais recentes...");
    try {
      const response = await apiRequest(`/api/pluggy/items/${itemId}/sync`, { method: "POST" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Não foi possível sincronizar.");
      await loadConnections();
      if (body.data?.refreshLimited) {
        toast.success("A instituição limitou uma nova consulta agora. Importei os dados disponíveis; tente novamente mais tarde.", { id: toastId });
      } else if (body.data?.synchronized) {
        toast.success("Dados novos recebidos e importados.", { id: toastId });
      } else if (body.data?.requiresUserInput) {
        toast.error("O banco pediu uma nova autorização. Use Reconectar para concluir.", { id: toastId });
      } else {
        toast.success("Atualização iniciada. Os lançamentos aparecerão automaticamente ao concluir.", { id: toastId });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao sincronizar.", { id: toastId });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    if (!removeId) return;
    const itemId = removeId;
    setBusyId(itemId);
    const toastId = toast.loading("Removendo conexão e dados importados...");
    try {
      const response = await apiRequest(`/api/pluggy/items/${itemId}`, { method: "DELETE" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Não foi possível remover a conexão.");
      setConnections((current) => current.filter((item) => item.id !== itemId));
      toast.success("Conexão removida com segurança.", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao remover.", { id: toastId });
    } finally {
      setBusyId(null);
      setRemoveId(null);
    }
  };

  return (
    <PageWrapper className="pt-7">
      <header className="mb-7">
        <Link href="/perfil" className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-fg">
          <ChevronLeft className="h-4 w-4" /> Perfil
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[.18em] text-brand">Open Finance</p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-fg">Suas contas, juntas.</h1>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
              Conecte instituições para trazer saldos e movimentações automaticamente ao Nexus.
            </p>
          </div>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-brand glow-sm">
            <Link2 className="h-5 w-5" />
          </span>
        </div>
      </header>

      <section className="relative mb-5 overflow-hidden rounded-[1.5rem] border border-white/[0.07] bg-surface p-5">
        <div aria-hidden="true" className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
          <div>
            <h2 className="font-bold text-fg">Conexão consentida e criptografada</h2>
            <p className="mt-1 text-xs leading-5 text-muted">
              O Nexus nunca recebe sua senha bancária. O acesso pode ser revogado a qualquer momento.
            </p>
          </div>
        </div>
      </section>

      <Button onClick={() => openConnect()} className="mb-7 gap-2">
        <Building2 className="h-4 w-4" /> Conectar instituição
      </Button>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-fg">Instituições</h2>
        <span className="text-xs text-subtle">{connections.length} conectada{connections.length === 1 ? "" : "s"}</span>
      </div>

      {loading ? (
        <div className="flex min-h-36 items-center justify-center rounded-2xl bg-surface text-muted">
          <LoaderCircle className="h-5 w-5 animate-spin" />
        </div>
      ) : connections.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-line bg-surface/60 px-6 py-10 text-center">
          <Unplug className="mx-auto h-7 w-7 text-subtle" />
          <h3 className="mt-4 font-bold text-fg">Nenhuma conta conectada</h3>
          <p className="mt-1 text-sm leading-6 text-muted">Comece pelo sandbox ou conecte sua instituição real quando sua aplicação Pluggy estiver em produção.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {connections.map((connection) => {
            const busy = busyId === connection.id;
            const needsAttention = connection.status !== "UPDATED";
            return (
              <li key={connection.id} className="rounded-[1.5rem] border border-white/[0.07] bg-surface p-5">
                <div className="flex items-start gap-3">
                  <InstitutionLogo
                    connectorId={connection.connectorId ?? undefined}
                    name={connection.connectorName ?? undefined}
                    size={44}
                    className="rounded-2xl bg-elevated p-1.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate font-bold text-fg">{connection.connectorName || "Instituição financeira"}</h3>
                        <p className="mt-0.5 text-xs text-muted">{connection.accountCount} conta{connection.accountCount === 1 ? "" : "s"} encontrada{connection.accountCount === 1 ? "" : "s"}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${needsAttention ? "bg-negative/10 text-negative" : "bg-brand/10 text-brand"}`}>
                        {STATUS_LABELS[connection.status] || connection.status}
                      </span>
                    </div>
                    <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-subtle">Saldo em contas</p>
                        <p className="mt-0.5 font-display text-xl font-bold text-fg">{money(connection.balance)}</p>
                      </div>
                      <ArrowDownLeft className="h-4 w-4 text-brand" />
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-[1fr_1fr_auto] gap-2">
                  <button disabled={busy} onClick={() => sync(connection.id)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-elevated px-3 text-xs font-bold text-fg transition hover:bg-line disabled:opacity-50">
                    <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} /> Sincronizar
                  </button>
                  <button disabled={busy} onClick={() => openConnect(connection.id)} className="min-h-11 rounded-xl border border-line px-3 text-xs font-bold text-muted transition hover:bg-elevated hover:text-fg disabled:opacity-50">
                    Reconectar
                  </button>
                  <button aria-label={`Remover ${connection.connectorName || "instituição"}`} disabled={busy} onClick={() => setRemoveId(connection.id)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-negative/15 text-negative transition hover:bg-negative/10 disabled:opacity-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {session ? (
        <PluggyConnect
          connectToken={session.accessToken}
          includeSandbox={session.includeSandbox}
          updateItem={session.itemId}
          language="pt"
          theme="dark"
          products={["ACCOUNTS", "CREDIT_CARDS", "TRANSACTIONS"]}
          allowConnectInBackground
          onSuccess={handleSuccess}
          onClose={() => setSession(null)}
          onError={({ message }) => {
            toast.error(message || "A instituição não concluiu a conexão.");
          }}
          onLoadError={() => {
            setSession(null);
            toast.error("Não foi possível carregar o ambiente seguro da Pluggy.");
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(removeId)}
        onOpenChange={(open) => !open && setRemoveId(null)}
        onCancel={() => setRemoveId(null)}
        onConfirm={remove}
        title="Desconectar instituição?"
        description="O consentimento será revogado e todas as movimentações importadas dessa conexão serão apagadas do Nexus. Seus lançamentos manuais continuam intactos."
      />
    </PageWrapper>
  );
}
