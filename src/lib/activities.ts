import type { Expense } from "@/types/expense";
import type { Income } from "@/types/income";
import {
  classifyFinancialMovements,
  type FinancialMovementNature,
} from "@/lib/financialMovement";

/**
 * Despesa e receita achatadas em um tipo só.
 *
 * As duas tabelas divergem no vocabulário (`metodo_pagamento` contra `fonte`)
 * mas a tela mostra as duas na mesma lista — a normalização vive aqui para
 * cada tela não reinventar o mesmo `map`.
 */
export interface Activity {
  key: string;
  kind: "expense" | "income";
  id: number;
  descricao: string;
  valor: number;
  /** Sempre YYYY-MM-DD, já sem a parte de hora. */
  data: string;
  categoriaId?: number | null;
  categoria?: string;
  cor?: string;
  detalhe?: string;
  instituicao?: string;
  instituicaoId?: number;
  fixo?: boolean;
  origem?: "manual" | "pluggy";
  natureza: FinancialMovementNature;
  expense?: Expense;
  income?: Income;
}

export type ActivityTypeFilter = "todas" | "entradas" | "saidas" | "movimentos";

/** Regra única dos filtros da tela, mantida fora do componente para ser testável. */
export function activityMatchesFilters(
  item: Activity,
  typeFilter: ActivityTypeFilter,
  categoryFilter: string,
  normalizedSearch: string
): boolean {
  if (typeFilter === "entradas" && item.natureza !== "income") return false;
  if (typeFilter === "saidas" && item.natureza !== "expense") return false;
  if (
    typeFilter === "movimentos" &&
    item.natureza !== "internal_transfer" &&
    item.natureza !== "card_payment"
  ) return false;

  if (categoryFilter === "sem-categoria" && item.categoriaId) return false;
  if (
    categoryFilter.startsWith("categoria:") &&
    String(item.categoriaId) !== categoryFilter.slice("categoria:".length)
  ) return false;

  if (!normalizedSearch) return true;
  return (
    item.descricao.toLowerCase().includes(normalizedSearch) ||
    (item.categoria?.toLowerCase().includes(normalizedSearch) ?? false) ||
    (item.instituicao?.toLowerCase().includes(normalizedSearch) ?? false)
  );
}

export const soData = (d: string) => d.split("T")[0].split(" ")[0];

/**
 * Data local a partir de YYYY-MM-DD.
 *
 * `new Date("2026-08-11")` seria interpretado como UTC e, no fuso do Brasil,
 * jogaria o lançamento para o dia anterior.
 */
export function dataLocal(iso: string): Date {
  const [ano, mes, dia] = soData(iso).split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

export function tituloDoDia(iso: string): string {
  const data = dataLocal(iso);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const diff = Math.round((hoje.getTime() - data.getTime()) / 86_400_000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";

  const formatado = data.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return formatado.charAt(0).toUpperCase() + formatado.slice(1);
}

/** Junta os dois lados e ordena do mais recente para o mais antigo. */
export function toActivities(
  despesas: Expense[],
  receitas: Income[]
): Activity[] {
  const lista: Array<Omit<Activity, "natureza">> = [
    ...despesas.map((e) => ({
      key: `expense-${e.id}`,
      kind: "expense" as const,
      id: e.id,
      descricao: e.tipo,
      valor: Number(e.quantidade),
      data: soData(e.data),
      categoriaId: e.category_id,
      categoria: e.categoria_nome,
      cor: e.cor_categoria,
      detalhe: e.metodo_pagamento,
      instituicao: e.instituicao_nome,
      instituicaoId: e.instituicao_id,
      fixo: e.fixo,
      origem: e.origem,
      financeNeutral: e.observacoes?.includes("Movimento neutro de cartão"),
      expense: e,
    })),
    ...receitas.map((r) => ({
      key: `income-${r.id}`,
      kind: "income" as const,
      id: r.id,
      descricao: r.tipo,
      valor: Number(r.quantidade),
      data: soData(r.data),
      categoriaId: r.category_id,
      categoria: r.categoria_nome,
      cor: r.cor_categoria,
      detalhe: r.conta_nome ?? r.fonte,
      instituicao: r.instituicao_nome,
      instituicaoId: r.instituicao_id,
      fixo: r.fixo,
      origem: r.origem,
      financeNeutral: r.nota?.includes("Movimento neutro de cartão"),
      income: r,
    })),
  ];

  return classifyFinancialMovements(lista).sort((a, b) => b.data.localeCompare(a.data));
}

/** Iniciais do avatar da linha, no espírito do logo redondo do extrato. */
export function iniciais(item: Activity): string {
  return (item.categoria ?? item.descricao).slice(0, 2).toUpperCase();
}
