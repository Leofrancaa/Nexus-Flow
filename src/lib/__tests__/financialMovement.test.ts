import { describe, expect, it } from "vitest";

import {
  classifyFinancialMovements,
  countsInCashFlow,
  isCardPayment,
} from "@/lib/financialMovement";

describe("classifyFinancialMovements", () => {
  it("pareia uma transferência entre contas sem somá-la como entrada ou saída", () => {
    const [outgoing, incoming] = classifyFinancialMovements([
      {
        key: "expense-1",
        kind: "expense" as const,
        descricao: "Pix enviado",
        categoria: "Transferências",
        valor: 500,
        data: "2026-08-14",
      },
      {
        key: "income-2",
        kind: "income" as const,
        descricao: "Pix recebido",
        categoria: "Transferências",
        valor: 500,
        data: "2026-08-14",
      },
    ]);

    expect(outgoing.natureza).toBe("internal_transfer");
    expect(incoming.natureza).toBe("internal_transfer");
    expect(countsInCashFlow(outgoing.natureza)).toBe(false);
  });

  it("mantém um PIX recebido sem contraparte como receita real", () => {
    const [income] = classifyFinancialMovements([
      {
        key: "income-1",
        kind: "income" as const,
        descricao: "Pix recebido cliente",
        categoria: "Transferências",
        valor: 850,
        data: "2026-08-14",
      },
    ]);

    expect(income.natureza).toBe("income");
  });

  it("identifica pagamento de fatura como movimento neutro", () => {
    expect(isCardPayment("Pagamento Cartão de crédito Nubank")).toBe(true);
    const [payment] = classifyFinancialMovements([
      {
        key: "expense-1",
        kind: "expense" as const,
        descricao: "Pagamento de fatura",
        valor: 1200,
        data: "2026-08-14",
      },
    ]);
    expect(payment.natureza).toBe("card_payment");
  });
});
