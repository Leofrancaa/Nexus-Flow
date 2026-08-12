"use client";

import { useEffect, useState, useCallback } from "react";
import PageTitle from "@/components/pageTitle";
import { NewThresholdModal } from "@/components/modals/newThresholdModal";
import { NewGoalModal } from "@/components/modals/newGoalModal";
import ThresholdCard from "@/components/cards/thresholdCard";
import GoalCard from "@/components/cards/goalCard";
import { Threshold } from "@/types/threshold";
import { toast } from "react-hot-toast";
import { EditThresholdModal } from "@/components/modals/editThresholdModal";
import { EditGoalModal } from "@/components/modals/editGoalModal";
import { useRouter } from "next/navigation";
import { apiRequest, hasActiveSession } from "@/lib/auth";
import ConfirmDialog from "@/components/ui/confirmDialog";

interface Goal {
  id: number;
  nome: string;
  valor_alvo: number;
  valor_atual: number;
  progresso: number;
  mes: number;
  ano: number;
}

const fetchGastoPorCategoria = async (categoryId: number): Promise<number> => {
  try {
    const res = await apiRequest(
      `/api/expenses/total-by-category/${categoryId}`
    );
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.data?.total || data.total || 0;
  } catch {
    return 0;
  }
};

export default function Limits() {
  const router = useRouter();

  useEffect(() => {
    void hasActiveSession().then((authenticated) => {
      if (!authenticated) router.push("/login");
    });
  }, [router]);

  const [limites, setLimites] = useState<Threshold[]>([]);
  const [metas, setMetas] = useState<Goal[]>([]);
  const [gastos, setGastos] = useState<Record<number, number>>({});
  const [editando, setEditando] = useState<Threshold | null>(null);
  const [editandoGoal, setEditandoGoal] = useState<Goal | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [thresholdToDelete, setThresholdToDelete] =
    useState<Threshold | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [goalConfirmDialogOpen, setGoalConfirmDialogOpen] = useState(false);

  const carregarDados = useCallback(async () => {
    try {
      // Carregar limites
      const resLimites = await apiRequest("/api/thresholds");
      if (!resLimites.ok) throw new Error();

      const responseDataLimites = await resLimites.json();
      const dataLimites: Threshold[] =
        responseDataLimites.data || responseDataLimites;
      setLimites(dataLimites);

      const gastosTemp: Record<number, number> = {};
      for (const lim of dataLimites) {
        gastosTemp[lim.category_id] = await fetchGastoPorCategoria(
          lim.category_id
        );
      }
      setGastos(gastosTemp);

      // Carregar metas (sem filtro de data - mostrar todas)
      const resMetas = await apiRequest(`/api/goals`);
      if (!resMetas.ok) throw new Error();

      const responseDataMetas = await resMetas.json();
      const dataMetas: Goal[] = responseDataMetas.data || [];
      setMetas(dataMetas);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Sessão expirada")) {
        router.push("/login");
      } else {
        toast.error("Erro ao carregar dados");
      }
    }
  }, [router]);

  const handleDelete = (threshold: Threshold) => {
    setThresholdToDelete(threshold);
    setConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!thresholdToDelete) return;

    try {
      const res = await apiRequest(`/api/thresholds/${thresholdToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      toast.success("Limite deletado com sucesso!");
      carregarDados();
    } catch {
      toast.error("Erro ao deletar limite");
    } finally {
      setThresholdToDelete(null);
    }
  };

  const handleGoalDelete = (goal: Goal) => {
    setGoalToDelete(goal);
    setGoalConfirmDialogOpen(true);
  };

  const confirmGoalDelete = async () => {
    if (!goalToDelete) return;

    try {
      const res = await apiRequest(`/api/goals/${goalToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      toast.success("Meta deletada com sucesso!");
      carregarDados();
    } catch {
      toast.error("Erro ao deletar meta");
    } finally {
      setGoalToDelete(null);
    }
  };

  const handleGoalEdit = (goal: Goal) => {
    setEditandoGoal(goal);
  };

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  return (
    <main
      className="flex flex-col min-h-screen px-8 py-8 lg:py-4"
      style={{ background: "var(--page-bg)" }}
    >
      <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
        <PageTitle
          title="Limites e Metas"
          subTitle="Gerencie e acompanhe seus limites e metas"
        />
        <div className="flex gap-2">
          <NewThresholdModal onCreated={carregarDados} />
          <NewGoalModal onCreated={carregarDados} />
        </div>
      </div>

      {/* Seção de Metas */}
      {metas.length > 0 && (
        <>
          <h2 className="text-2xl font-bold text-[var(--card-text)] mt-8 mb-4">
            Metas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {metas.map((meta) => (
              <GoalCard
                key={meta.id}
                goal={meta}
                onEdit={handleGoalEdit}
                onDelete={handleGoalDelete}
              />
            ))}
          </div>
        </>
      )}

      {/* Seção de Limites */}
      <h2 className="text-2xl font-bold text-[var(--card-text)] mt-8 mb-4">
        Limites
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {limites.map((limite) =>
          limite.categoria ? (
            <ThresholdCard
              key={limite.id}
              threshold={limite}
              gastoAtual={gastos[limite.category_id] || 0}
              onEdit={(limite) => setEditando(limite)}
              onDelete={handleDelete}
            />
          ) : (
            <div
              key={limite.id}
              className="p-4 rounded-lg text-sm shadow-md"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--card-border)",
                color: "var(--card-text)",
              }}
            >
              Limite sem categoria vinculada
            </div>
          )
        )}
      </div>

      {editando && (
        <EditThresholdModal
          threshold={editando}
          onClose={() => setEditando(null)}
          onUpdated={carregarDados}
        />
      )}

      {editandoGoal && (
        <EditGoalModal
          goal={editandoGoal}
          onClose={() => setEditandoGoal(null)}
          onUpdated={carregarDados}
        />
      )}

      <ConfirmDialog
        open={confirmDialogOpen}
        title="Deletar Limite"
        description={`Deseja realmente deletar o limite de ${thresholdToDelete?.categoria?.nome}?`}
        onCancel={() => setThresholdToDelete(null)}
        onConfirm={confirmDelete}
        onOpenChange={setConfirmDialogOpen}
      />

      <ConfirmDialog
        open={goalConfirmDialogOpen}
        title="Deletar Meta"
        description={`Deseja realmente deletar a meta "${goalToDelete?.nome}"?`}
        onCancel={() => setGoalToDelete(null)}
        onConfirm={confirmGoalDelete}
        onOpenChange={setGoalConfirmDialogOpen}
      />
    </main>
  );
}
