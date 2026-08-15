"use client";

import Link from "next/link";
import { Check, LoaderCircle, Plus, RefreshCw, TriangleAlert } from "lucide-react";

import { InstitutionLogo } from "@/components/activities/transactionIcon";
import { Modal } from "@/components/ui/modal";

export interface SyncConnection {
  id: string;
  connectorId: number | null;
  connectorName: string | null;
  status: string;
  lastSyncedAt: string | null;
  accountCount: number;
}

interface SyncAccountsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connections: SyncConnection[];
  loading: boolean;
  syncingAll: boolean;
  busyId: string | null;
  progress: { atual: number; total: number } | null;
  onSyncAll: () => void;
  onSyncOne: (connection: SyncConnection) => void;
}

const RELATIVE_TIME = new Intl.RelativeTimeFormat("pt-BR", { numeric: "always" });

function lastUpdate(value: string | null) {
  if (!value) return "Ainda não sincronizada";

  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (elapsedMinutes < 1) return "Atualizado agora";
  if (elapsedMinutes < 60) return `Atualizado ${RELATIVE_TIME.format(-elapsedMinutes, "minute")}`;

  const hours = Math.floor(elapsedMinutes / 60);
  if (hours < 24) return `Atualizado ${RELATIVE_TIME.format(-hours, "hour")}`;
  return `Atualizado ${RELATIVE_TIME.format(-Math.floor(hours / 24), "day")}`;
}

function needsAttention(status: string) {
  return ["WAITING_USER_INPUT", "WAITING_USER_ACTION", "LOGIN_ERROR"].includes(status);
}

export function SyncAccountsModal({
  open,
  onOpenChange,
  connections,
  loading,
  syncingAll,
  busyId,
  progress,
  onSyncAll,
  onSyncOne,
}: SyncAccountsModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Sincronizar contas"
      description="Atualize uma instituição ou todas de uma vez."
      className="sm:max-w-sm"
    >
      {loading ? (
        <div className="space-y-3" aria-label="Carregando instituições">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-[4.5rem] animate-pulse rounded-2xl bg-elevated" />
          ))}
        </div>
      ) : connections.length > 0 ? (
        <ul className="space-y-2.5">
          {connections.map((connection) => {
            const busy = syncingAll || busyId === connection.id;
            const attention = needsAttention(connection.status);

            return (
              <li
                key={connection.id}
                className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-elevated/65 p-3"
              >
                <InstitutionLogo
                  connectorId={connection.connectorId ?? undefined}
                  name={connection.connectorName ?? undefined}
                  size={48}
                  className="border border-white/10"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base font-bold text-fg">
                    {connection.connectorName || "Instituição"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {attention ? "Reconexão necessária" : lastUpdate(connection.lastSyncedAt)}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[11px] text-subtle">
                    {attention ? (
                      <TriangleAlert className="h-3 w-3 text-warning" aria-hidden="true" />
                    ) : (
                      <Check className="h-3 w-3 text-positive" aria-hidden="true" />
                    )}
                    {connection.accountCount} {connection.accountCount === 1 ? "conta" : "contas"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onSyncOne(connection)}
                  disabled={busy}
                  aria-label={`Sincronizar ${connection.connectorName || "instituição"}`}
                  className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-full border border-white/10 bg-surface text-brand transition-[background-color,transform,opacity] hover:bg-line active:scale-95 disabled:cursor-wait disabled:opacity-50"
                >
                  {busy ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-line p-5 text-center">
          <p className="text-sm font-semibold text-fg">Nenhuma instituição conectada</p>
          <p className="mt-1 text-xs text-muted">Conecte uma conta para importar suas movimentações.</p>
        </div>
      )}

      <div className="mt-4 space-y-2.5">
        {connections.length > 0 ? (
          <button
            type="button"
            onClick={onSyncAll}
            disabled={syncingAll || Boolean(busyId)}
            className="flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-2xl bg-brand px-4 font-bold text-bg transition-[opacity,transform,box-shadow] glow-sm hover:opacity-90 active:scale-[.98] disabled:cursor-wait disabled:opacity-55 disabled:shadow-none"
          >
            {syncingAll ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            )}
            <span aria-live="polite">
              {syncingAll && progress
                ? `Sincronizando ${progress.atual}/${progress.total}`
                : "Sincronizar todas"}
            </span>
          </button>
        ) : null}

        <Link
          href="/open-finance"
          className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-line px-4 font-semibold text-fg transition-[background-color,transform] hover:bg-elevated active:scale-[.98]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {connections.length > 0 ? "Gerenciar contas" : "Adicionar conta"}
        </Link>
      </div>
    </Modal>
  );
}
