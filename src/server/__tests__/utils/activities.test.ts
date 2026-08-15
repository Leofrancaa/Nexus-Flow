import { describe, expect, it } from "vitest";

import {
  activityMatchesFilters,
  toActivities,
  type Activity,
} from "@/lib/activities";

const expense: Activity = {
  key: "expense-1",
  kind: "expense",
  id: 1,
  descricao: "Subway",
  valor: 42,
  data: "2026-08-15",
  categoriaId: 7,
  categoria: "Alimentação",
  instituicao: "Nubank",
  natureza: "expense",
};

describe("activity filters", () => {
  it("preserva o id da categoria ao normalizar receitas e despesas", () => {
    const [normalizedExpense, normalizedIncome] = toActivities(
      [{
        id: 1,
        tipo: "Subway",
        quantidade: 42,
        metodo_pagamento: "crédito",
        data: "2026-08-15",
        category_id: 7,
      }],
      [{
        id: 2,
        tipo: "Salário",
        quantidade: 3000,
        fonte: "Empresa",
        data: "2026-08-10",
        category_id: 9,
      }]
    );

    expect(normalizedExpense.categoriaId).toBe(7);
    expect(normalizedIncome.categoriaId).toBe(9);
  });

  it("filtra por categoria junto com tipo e busca", () => {
    expect(activityMatchesFilters(expense, "saidas", "categoria:7", "subway")).toBe(true);
    expect(activityMatchesFilters(expense, "entradas", "categoria:7", "")).toBe(false);
    expect(activityMatchesFilters(expense, "saidas", "categoria:8", "")).toBe(false);
    expect(activityMatchesFilters(expense, "saidas", "categoria:7", "itau")).toBe(false);
  });

  it("separa movimentos sem categoria", () => {
    expect(
      activityMatchesFilters({ ...expense, categoriaId: null }, "todas", "sem-categoria", "")
    ).toBe(true);
    expect(activityMatchesFilters(expense, "todas", "sem-categoria", "")).toBe(false);
  });
});
