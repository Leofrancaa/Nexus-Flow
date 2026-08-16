export type FinancialMovementNature =
  | "income"
  | "expense"
  | "internal_transfer"
  | "card_payment";

interface MovementLike {
  key: string;
  kind: "expense" | "income";
  descricao: string;
  valor: number;
  data: string;
  categoria?: string;
  financeNeutral?: boolean;
}

function normalizeText(value?: string): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Pagamento da fatura movimenta caixa, mas não é um novo consumo. */
export function isCardPayment(description?: string): boolean {
  const text = normalizeText(description);
  return (
    /pagamento.*(cartao|fatura)/.test(text) ||
    /(cartao|fatura).*pagamento/.test(text) ||
    /pgto.*(cartao|fatura)/.test(text) ||
    text.includes("credit card payment")
  );
}

function isTransferCandidate(item: MovementLike): boolean {
  const category = normalizeText(item.categoria);
  const description = normalizeText(item.descricao);

  return (
    category.startsWith("transfer") ||
    description.includes("same person transfer") ||
    description.includes("transferencia") ||
    description.includes("pix enviado") ||
    description.includes("pix recebido") ||
    description.includes("ted enviada") ||
    description.includes("ted recebida")
  );
}

function isOwnReserveMovement(item: MovementLike): boolean {
  const description = normalizeText(item.descricao);
  const reserve = /(bolao|cofrinho|reserva)/;
  return (
    reserve.test(description) &&
    (
      /(dinheiro retirado|resgate)/.test(description) ||
      /(dinheiro (guardado|reservado)|aplicacao)/.test(description)
    )
  );
}

function dayNumber(date: string): number {
  const [year, month, day] = date.split("T")[0].split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

/**
 * Classifica movimentos que não devem inflar entradas e saídas.
 *
 * Uma transferência só é considerada interna quando existe a contraparte de
 * mesmo valor, em sentido oposto, com até dois dias de diferença. Isso evita
 * esconder um PIX recebido de outra pessoa ou um PIX pago a um terceiro.
 */
export function classifyFinancialMovements<T extends MovementLike>(
  movements: T[]
): Array<T & { natureza: FinancialMovementNature }> {
  const classified = movements.map((item) => ({
    ...item,
    natureza: (item.kind === "income" ? "income" : "expense") as FinancialMovementNature,
  }));

  for (const item of classified) {
    if (isOwnReserveMovement(item)) {
      item.natureza = "internal_transfer";
    } else if (item.financeNeutral || (item.kind === "expense" && isCardPayment(item.descricao))) {
      item.natureza = "card_payment";
    }
  }

  const availableIncomes = classified.filter(
    (item) => item.kind === "income" && isTransferCandidate(item)
  );
  const pairedIncomeKeys = new Set<string>();

  for (const expense of classified) {
    if (
      expense.kind !== "expense" ||
      expense.natureza !== "expense" ||
      !isTransferCandidate(expense)
    ) {
      continue;
    }

    const match = availableIncomes.find(
      (income) =>
        !pairedIncomeKeys.has(income.key) &&
        Math.abs(Math.round(income.valor * 100) - Math.round(expense.valor * 100)) === 0 &&
        Math.abs(dayNumber(income.data) - dayNumber(expense.data)) <= 2
    );

    if (match) {
      expense.natureza = "internal_transfer";
      match.natureza = "internal_transfer";
      pairedIncomeKeys.add(match.key);
    }
  }

  return classified;
}

export function countsInCashFlow(nature: FinancialMovementNature): boolean {
  return nature === "income" || nature === "expense";
}
