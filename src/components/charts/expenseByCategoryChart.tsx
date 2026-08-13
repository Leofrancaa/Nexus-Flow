"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { toast } from "react-hot-toast";
import { apiRequest } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface CategoriaResumo {
  nome: string;
  cor: string;
  total: number;
  quantidade: number;
  percentual: number;
}

interface Props {
  mes: number;
  ano: number;
  refreshKey: number;
}

export function ExpenseByCategoryChart({ mes, ano, refreshKey }: Props) {
  const [dados, setDados] = useState<CategoriaResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!mes || !ano || isNaN(mes) || isNaN(ano)) return;

    const fetchData = async () => {
      try {
        const res = await apiRequest(
          `/api/expenses/category-resume?mes=${mes}&ano=${ano}`
        );

        if (!res.ok) throw new Error("Erro ao buscar dados");

        const json = await res.json();
        setDados(json.data || []);
      } catch (error) {
        console.error("Erro ao carregar gráfico de categorias", error);
        if (
          error instanceof Error &&
          error.message.includes("Sessão expirada")
        ) {
          router.push("/login");
        } else {
          toast.error("Erro ao carregar gráfico de categorias");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mes, ano, refreshKey, router]);

  if (loading)
    return <p className="text-[var(--chart-title)]">Carregando gráfico...</p>;

  if (dados.length === 0)
    return <p className="text-[var(--chart-title)]">Nenhum dado encontrado.</p>;

  return (
    <div className="bg-[var(--chart-bg)] p-6 rounded-xl shadow-lg w-full lg:w-[58%] border border-[var(--card-border)]">
      <h2 className="text-[var(--chart-title)] text-lg font-semibold mb-4">
        Gastos por Categoria
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={dados}>
          <XAxis dataKey="nome" stroke="var(--chart-axis)" />
          <YAxis stroke="var(--chart-axis)" />
          <Tooltip
            formatter={(value) =>
              Number(value ?? 0).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })
            }
            contentStyle={{
              backgroundColor: "var(--chart-tooltip-bg)",
              borderColor: "var(--chart-tooltip-border)",
              borderRadius: 8,
            }}
            labelStyle={{ color: "var(--chart-tooltip-label)" }}
            itemStyle={{ color: "var(--chart-tooltip-item)" }}
          />
          <Bar dataKey="total" radius={[6, 6, 0, 0]}>
            {dados.map((item, index) => (
              <Cell key={index} fill={item.cor || "#22d3ee"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
