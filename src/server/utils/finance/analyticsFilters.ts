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

const CREDIT_CARD_PURCHASE = sql`
  (
    e.card_id IS NOT NULL
    OR COALESCE(e.metodo_pagamento, '') ~* '(cart[aã]o.*cr[eé]dito|^cr[eé]dito$|credit card)'
  )
`;

const EXPENSE_CARD_LEDGER_ADJUSTMENT = sql`
  COALESCE(e.observacoes, '') ILIKE '%movimento neutro de cartão%'
`;

const INCOME_CARD_LEDGER_ADJUSTMENT = sql`
  COALESCE(i.nota, '') ILIKE '%movimento neutro de cartão%'
`;

const EXPENSE_INTERNAL_TRANSFER = sql`
  (
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
`;

/**
 * Compras no crédito pertencem ao mês da fatura; débitos, PIX, boletos e o
 * próprio pagamento da fatura pertencem ao mês em que saíram da conta.
 */
export const expenseInPeriod = (month: number, year: number) => sql`
  CASE
    WHEN ${CREDIT_CARD_PURCHASE}
      AND e.competencia_mes IS NOT NULL
      AND e.competencia_ano IS NOT NULL
    THEN e.competencia_mes = ${month} AND e.competencia_ano = ${year}
    ELSE EXTRACT(MONTH FROM e.data) = ${month}
      AND EXTRACT(YEAR FROM e.data) = ${year}
  END
`;

export const expensePeriodMonth = sql`
  CASE
    WHEN ${CREDIT_CARD_PURCHASE}
      AND e.competencia_mes IS NOT NULL
      AND e.competencia_ano IS NOT NULL
    THEN e.competencia_mes
    ELSE EXTRACT(MONTH FROM e.data)::int
  END
`;

export const expensePeriodYear = sql`
  CASE
    WHEN ${CREDIT_CARD_PURCHASE}
      AND e.competencia_mes IS NOT NULL
      AND e.competencia_ano IS NOT NULL
    THEN e.competencia_ano
    ELSE EXTRACT(YEAR FROM e.data)::int
  END
`;

/**
 * Uma parcela PENDING pode trazer a data original da compra, embora pertença
 * a uma fatura futura. Ela continua disponível para projeções, mas ainda não
 * é uma atividade realizada nem pode entrar nos totais do período.
 */
export const expenseIsRealized = sql`
  e.data <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date
  AND NOT (
    COALESCE(e.observacoes, '') ILIKE '%lançamento previsto de cartão%'
    AND e.competencia_ano IS NOT NULL
    AND e.competencia_mes IS NOT NULL
    AND (
      e.competencia_ano > EXTRACT(
        YEAR FROM CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo'
      )
      OR (
        e.competencia_ano = EXTRACT(
          YEAR FROM CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo'
        )
        AND e.competencia_mes > EXTRACT(
          MONTH FROM CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo'
        )
      )
    )
  )
`;

export const incomeIsRealized = sql`
  i.data <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date
`;

/** Movimentos reais/projetados, sem pagamentos e ajustes neutros. */
export const expenseCountsForForecast = sql`
  NOT (
    ${CARD_PAYMENT}
    OR ${EXPENSE_CARD_LEDGER_ADJUSTMENT}
    OR ${EXPENSE_INTERNAL_TRANSFER}
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

/** Totais realizados nunca incluem dias que ainda não chegaram no Brasil. */
export const expenseCountsForAnalytics = sql`
  ${expenseCountsForForecast}
  AND ${expenseIsRealized}
`;

export const incomeCountsForAnalytics = sql`
  ${incomeCountsForForecast}
  AND ${incomeIsRealized}
`;
