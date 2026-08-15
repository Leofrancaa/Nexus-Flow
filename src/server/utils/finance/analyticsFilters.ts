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

const EXPENSE_CARD_LEDGER_ADJUSTMENT = sql`
  COALESCE(e.observacoes, '') ILIKE '%movimento neutro de cartão%'
`;

const INCOME_CARD_LEDGER_ADJUSTMENT = sql`
  COALESCE(i.nota, '') ILIKE '%movimento neutro de cartão%'
`;

const EXPENSE_PENDING_CARD_TRANSACTION = sql`
  COALESCE(e.observacoes, '') ILIKE '%lançamento previsto de cartão%'
`;

const INCOME_PENDING_CARD_TRANSACTION = sql`
  COALESCE(i.nota, '') ILIKE '%lançamento previsto de cartão%'
`;

/** Movimentos reais/projetados, sem pagamentos e ajustes neutros. */
export const expenseCountsForForecast = sql`
  NOT (
    ${CARD_PAYMENT}
    OR ${EXPENSE_CARD_LEDGER_ADJUSTMENT}
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

export const incomeCountsForForecast = sql`
  NOT (
    ${INCOME_CARD_LEDGER_ADJUSTMENT}
    OR (
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
  )
`;

/** Totais realizados: previsões PENDING ficam somente no saldo futuro/faturas. */
export const expenseCountsForAnalytics = sql`
  ${expenseCountsForForecast}
  AND NOT (${EXPENSE_PENDING_CARD_TRANSACTION})
`;

export const incomeCountsForAnalytics = sql`
  ${incomeCountsForForecast}
  AND NOT (${INCOME_PENDING_CARD_TRANSACTION})
`;
