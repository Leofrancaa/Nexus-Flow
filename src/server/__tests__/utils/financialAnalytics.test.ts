import { describe, expect, it } from "vitest";

import { db } from "../mocks/db";
import * as schema from "@/server/db/schema";
import { getComparativoMensal } from "@/server/utils/finance/getComparativoMensal";
import { getGastosPorCategoria } from "@/server/utils/finance/getGastosPorCategoria";
import { getSaldoFuturo } from "@/server/utils/finance/getSaldoFuturo";
import { getSaldoAtual } from "@/server/utils/finance/getSaldoAtual";

const USER_ID = 1;
const SERVICE_USER_ID = USER_ID as unknown as string;

describe("financial analytics", () => {
  it("não infla fluxo, saldo e categorias com transferência interna ou pagamento de fatura", async () => {
    const [expenseTransferCategory, incomeTransferCategory, shoppingCategory] = await db
      .insert(schema.categories)
      .values([
        { nome: "Transferências", cor: "#64748b", tipo: "despesa", user_id: USER_ID },
        { nome: "Transferências", cor: "#818cf8", tipo: "receita", user_id: USER_ID },
        { nome: "Compras", cor: "#f59e0b", tipo: "despesa", user_id: USER_ID },
      ])
      .returning();

    await db.insert(schema.incomes).values([
      {
        tipo: "Salário",
        quantidade: "3000",
        data: new Date("2026-08-10T12:00:00"),
        user_id: USER_ID,
      },
      {
        tipo: "Pix recebido mesma titularidade",
        quantidade: "500",
        data: new Date("2026-08-14T12:00:00"),
        category_id: incomeTransferCategory.id,
        user_id: USER_ID,
      },
      {
        tipo: "Pagamento recebido",
        quantidade: "3307.49",
        data: new Date("2026-08-02T12:00:00"),
        nota: "Movimento neutro de cartão · Sincronizado via Open Finance",
        user_id: USER_ID,
      },
    ]);

    await db.insert(schema.expenses).values([
      {
        metodo_pagamento: "pix",
        tipo: "Pix enviado mesma titularidade",
        quantidade: "500",
        data: new Date("2026-08-14T12:00:00"),
        category_id: expenseTransferCategory.id,
        user_id: USER_ID,
      },
      {
        metodo_pagamento: "débito",
        tipo: "Pagamento de fatura Nubank",
        quantidade: "1000",
        data: new Date("2026-08-15T12:00:00"),
        user_id: USER_ID,
      },
      {
        metodo_pagamento: "Cartão de crédito",
        tipo: "Saldo em atraso",
        quantidade: "3195.66",
        data: new Date("2026-08-04T12:00:00"),
        observacoes: "Movimento neutro de cartão · Sincronizado via Open Finance",
        user_id: USER_ID,
      },
      {
        metodo_pagamento: "crédito",
        tipo: "Compra real",
        quantidade: "200",
        data: new Date("2026-08-12T12:00:00"),
        category_id: shoppingCategory.id,
        user_id: USER_ID,
      },
    ]);

    const [comparison, categories, currentBalance] = await Promise.all([
      getComparativoMensal(SERVICE_USER_ID, 8, 2026),
      getGastosPorCategoria(SERVICE_USER_ID, 8, 2026),
      getSaldoAtual(SERVICE_USER_ID),
    ]);
    const futureBalance = await getSaldoFuturo(
      SERVICE_USER_ID,
      currentBalance,
      new Date("2026-08-15T12:00:00Z")
    );

    expect(comparison.receitas.atual).toBe(3000);
    expect(comparison.despesas.atual).toBe(200);
    expect(comparison.saldo).toBe(2800);
    expect(categories).toEqual([{ id: shoppingCategory.id, nome: "Compras", total: 200 }]);
    expect(futureBalance).toBe(2800);
  });
});
