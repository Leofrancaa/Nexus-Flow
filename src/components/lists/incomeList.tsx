"use client";

import { useEffect, useState } from "react";
import EditButton from "../ui/editButton";
import DeleteButton from "../ui/deleteButton";
import ConfirmDialog from "../ui/confirmDialog";
import { toast } from "react-hot-toast";
import { EditIncomeModal } from "../modals/editIncomeModal";
import { Income } from "@/types/income";
import { apiRequest } from "@/lib/auth";
import { formatDateBR } from "@/lib/utils";

interface IncomeListProps {
  refreshKey: number;
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
  searchTerm: string;
  categoryId: string;
  period: string;
  customMonth?: string;
  customYear?: string;
}

export function IncomeList({
  refreshKey,
  setRefreshKey,
  searchTerm,
  categoryId,
  period,
  customMonth,
  customYear,
}: IncomeListProps) {
  const [incomes, setIncomes] = useState<Income[] | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedIncomeId, setSelectedIncomeId] = useState<number | null>(null);
  const [editIncome, setEditIncome] = useState<Income | null>(null);

  useEffect(() => {
    const fetchIncomes = async () => {
      try {
        let startDate = "";
        let endDate = "";

        const pad = (n: number) => String(n).padStart(2, "0");

        if (period === "custom" && customMonth && customYear) {
          const mes = parseInt(customMonth);
          const ano = parseInt(customYear);
          startDate = `${ano}-${pad(mes)}-01`;
          endDate = new Date(ano, mes, 0).toISOString().split("T")[0];
        } else {
          const now = new Date();
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
          const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

          switch (period) {
            case "mes_passado":
              startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                .toISOString()
                .split("T")[0];
              endDate = new Date(now.getFullYear(), now.getMonth(), 0)
                .toISOString()
                .split("T")[0];
              break;
            case "ultimos_3_meses":
              startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
                .toISOString()
                .split("T")[0];
              endDate = lastDay.toISOString().split("T")[0];
              break;
            case "ano_atual":
              startDate = `${now.getFullYear()}-01-01`;
              endDate = `${now.getFullYear()}-12-31`;
              break;
            case "mes_atual":
            default:
              startDate = firstDay.toISOString().split("T")[0];
              endDate = lastDay.toISOString().split("T")[0];
          }
        }

        const res = await apiRequest(
          `/api/incomes?start_date=${startDate}&end_date=${endDate}`
        );

        const data = await res.json();
        let filtrado = (data.data || []) as Income[];

        if (categoryId !== "todas") {
          filtrado = filtrado.filter(
            (e) => String(e.category_id) === categoryId
          );
        }

        if (searchTerm.trim() !== "") {
          filtrado = filtrado.filter((e) =>
            e.tipo.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        setIncomes(filtrado);
      } catch (error) {
        console.error("Erro ao carregar receitas:", error);
        setIncomes([]);
      }
    };

    fetchIncomes();
  }, [refreshKey, searchTerm, categoryId, period, customMonth, customYear]);

  const handleDelete = async (id: number) => {
    const toastId = toast.loading("Excluindo receita...");

    try {
      const res = await apiRequest(`/api/incomes/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erro ao excluir receita.");
      }

      await res.json();

      setIncomes((prev) => prev?.filter((e) => e.id !== id) || []);
      setRefreshKey((prev) => prev + 1);
      toast.success("Receita excluída com sucesso!", { id: toastId });
    } catch (err: unknown) {
      console.error(err);
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao excluir receita.";
      toast.error(errorMessage, { id: toastId });
    }
  };

  return (
    <div className="bg-[var(--list-bg)] border border-[var(--card-border)] rounded-2xl p-6 w-full lg:max-w-[80%] text-[var(--foreground)]">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--card-text)]">
          Receitas Recentes
        </h2>
        <p className="text-base text-muted-foreground">
          Últimas entradas registradas
        </p>
      </div>

      <div className="space-y-5">
        {incomes && incomes.length > 0 ? (
          incomes.map((income) => (
            <div
              key={income.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl bg-[var(--card-list-bg)] border border-[var(--card-border)] p-5 hover:border-[#00D4D4] transition-all"
            >
              <div className="flex flex-col flex-1 break-words">
                <p className="text-lg font-bold text-[var(--card-text)] flex items-center gap-2">
                  {income.tipo}
                </p>

                <div className="text-sm lg:text-md text-muted-foreground mt-2 flex flex-wrap gap-2 items-center">
                  {income.categoria_nome ? (
                    <span className="font-medium text-[var(--card-text)]">
                      {income.categoria_nome}
                    </span>
                  ) : (
                    <span className="text-red-400">Sem categoria</span>
                  )}
                  <span>•</span>
                  <span className="text-[var(--card-text)] font-medium">
                    {income.fonte}
                  </span>
                  <span>•</span>
                  <span className="text-[var(--card-text)] font-medium">
                    {formatDateBR(income.data)}
                  </span>
                  {(income.nota || income.observacoes) && (
                    <>
                      <span>•</span>
                      <span className="text-muted-foreground truncate max-w-[180px]">
                        Obs: {income.nota || income.observacoes}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-between sm:justify-end items-center gap-4 w-full sm:w-auto">
                <p className="text-green-400 font-bold text-lg whitespace-nowrap">
                  +
                  {income.quantidade.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>

                <div className="flex gap-2">
                  <EditButton onClick={() => setEditIncome(income)} />
                  <DeleteButton
                    onClick={() => {
                      setSelectedIncomeId(income.id);
                      setConfirmOpen(true);
                    }}
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-base text-muted-foreground mt-2">
            Nenhuma receita encontrada para o filtro atual.
          </p>
        )}
      </div>

      {selectedIncomeId !== null && (
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          onCancel={() => setSelectedIncomeId(null)}
          onConfirm={() => {
            if (selectedIncomeId !== null) {
              handleDelete(selectedIncomeId);
              setSelectedIncomeId(null);
            }
          }}
        />
      )}

      {editIncome && (
        <EditIncomeModal
          income={editIncome}
          onClose={() => setEditIncome(null)}
          onUpdated={() => {
            setEditIncome(null);
            setRefreshKey((prev) => prev + 1);
          }}
        />
      )}
    </div>
  );
}
