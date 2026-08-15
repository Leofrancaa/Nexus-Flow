import { sql } from "drizzle-orm";

// Estes fragmentos usam os aliases `e` (expenses) e `i` (incomes). Eles vivem
// centralizados para dashboard, relatórios e assistente contarem exatamente os
// mesmos movimentos.
const EXPENSE_TRANSFER_CANDIDATE = sql`
  (
    EXISTS (
      SELECT 1 FROM categories movement_category
      WHERE movement_category.id = e.category_id
        AND LOWER(COALESCE(movement_category.nome, '')) LIKE 'transfer%'
    )
    OR COALESCE(e.tipo, '') ILIKE ANY (
      ARRAY['%same person transfer%', '%transferencia%', '%transferência%', '%pix enviado%', '%ted enviada%']::text[]
    )
  )
`;

const INCOME_TRANSFER_CANDIDATE = sql`
  (
    EXISTS (
      SELECT 1 FROM categories movement_category
      WHERE movement_category.id = i.category_id
        AND LOWER(COALESCE(movement_category.nome, '')) LIKE 'transfer%'
    )
    OR COALESCE(i.tipo, '') ILIKE ANY (
      ARRAY['%same person transfer%', '%transferencia%', '%transferência%', '%pix recebido%', '%ted recebida%']::text[]
    )
  )
`;

const CARD_PAYMENT = sql`
  (
    COALESCE(e.tipo, '') ~* '(pagamento.*(cart[aã]o|fatura)|(cart[aã]o|fatura).*pagamento|pgto.*(cart[aã]o|fatura)|credit card payment)'
  )
`;

/** Despesas de consumo: exclui pagamento de fatura e transferências internas pareadas. */
export const expenseCountsForAnalytics = sql`
  NOT (
    ${CARD_PAYMENT}
    OR (
      ${EXPENSE_TRANSFER_CANDIDATE}
      AND EXISTS (
        SELECT 1
        FROM incomes paired_income
        WHERE paired_income.user_id = e.user_id
          AND paired_income.quantidade = e.quantidade
          AND ABS(paired_income.data - e.data) <= 2
          AND (
            EXISTS (
              SELECT 1 FROM categories paired_category
              WHERE paired_category.id = paired_income.category_id
                AND LOWER(COALESCE(paired_category.nome, '')) LIKE 'transfer%'
            )
            OR COALESCE(paired_income.tipo, '') ILIKE ANY (
              ARRAY['%same person transfer%', '%transferencia%', '%transferência%', '%pix recebido%', '%ted recebida%']::text[]
            )
          )
      )
    )
  )
`;

/** Receitas reais: exclui a entrada que é contraparte de transferência interna. */
export const incomeCountsForAnalytics = sql`
  NOT (
    ${INCOME_TRANSFER_CANDIDATE}
    AND EXISTS (
      SELECT 1
      FROM expenses paired_expense
      WHERE paired_expense.user_id = i.user_id
        AND paired_expense.quantidade = i.quantidade
        AND ABS(paired_expense.data - i.data) <= 2
        AND (
          EXISTS (
            SELECT 1 FROM categories paired_category
            WHERE paired_category.id = paired_expense.category_id
              AND LOWER(COALESCE(paired_category.nome, '')) LIKE 'transfer%'
          )
          OR COALESCE(paired_expense.tipo, '') ILIKE ANY (
            ARRAY['%same person transfer%', '%transferencia%', '%transferência%', '%pix enviado%', '%ted enviada%']::text[]
          )
        )
    )
  )
`;
