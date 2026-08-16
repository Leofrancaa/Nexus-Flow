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

const EXPENSE_INSTITUTION = sql`
  COALESCE(
    (
      SELECT tracking_card.instituicao
      FROM cards tracking_card
      WHERE tracking_card.id = e.card_id
        AND tracking_card.user_id = e.user_id
      LIMIT 1
    ),
    (
      SELECT tracking_item.connector_name
      FROM pluggy_accounts tracking_account
      JOIN pluggy_items tracking_item
        ON tracking_item.item_id = tracking_account.item_id
       AND tracking_item.user_id = tracking_account.user_id
      WHERE tracking_account.account_id = e.pluggy_account_id
        AND tracking_account.user_id = e.user_id
      LIMIT 1
    ),
    ''
  )
`;

const INCOME_INSTITUTION = sql`
  COALESCE(
    (
      SELECT tracking_item.connector_name
      FROM pluggy_accounts tracking_account
      JOIN pluggy_items tracking_item
        ON tracking_item.item_id = tracking_account.item_id
       AND tracking_item.user_id = tracking_account.user_id
      WHERE tracking_account.account_id = i.pluggy_account_id
        AND tracking_account.user_id = i.user_id
      LIMIT 1
    ),
    ''
  )
`;

const EXPENSE_IS_MERCADO_PAGO = sql`${EXPENSE_INSTITUTION} ILIKE '%mercado pago%'`;
const EXPENSE_IS_NUBANK = sql`${EXPENSE_INSTITUTION} ILIKE '%nubank%'`;
const EXPENSE_IS_ITAU = sql`${EXPENSE_INSTITUTION} ILIKE ANY (ARRAY['%itaú%', '%itau%']::text[])`;
const INCOME_IS_MERCADO_PAGO = sql`${INCOME_INSTITUTION} ILIKE '%mercado pago%'`;
const INCOME_IS_NUBANK = sql`${INCOME_INSTITUTION} ILIKE '%nubank%'`;
const INCOME_IS_ITAU = sql`${INCOME_INSTITUTION} ILIKE ANY (ARRAY['%itaú%', '%itau%']::text[])`;

/**
 * Marco inicial escolhido para conciliar o app com os saldos reais sem apagar
 * o histórico importado. Movimentos manuais e instituições futuras continuam
 * visíveis; o recorte vale apenas para as três conexões conhecidas.
 *
 * Mercado Pago: conta a partir de 12/08/2026 ou cartão da fatura 09/2026+.
 * Nubank: a partir de 25/07/2026.
 * Itaú: a partir de 14/08/2026.
 */
export const expenseInTrackingWindow = sql`
  (
    NOT (${EXPENSE_IS_MERCADO_PAGO} OR ${EXPENSE_IS_NUBANK} OR ${EXPENSE_IS_ITAU})
    OR (
      ${EXPENSE_IS_MERCADO_PAGO}
      AND (
        e.data >= DATE '2026-08-12'
        OR (
          ${CREDIT_CARD_PURCHASE}
          AND (COALESCE(e.competencia_ano, 0) * 100 + COALESCE(e.competencia_mes, 0)) >= 202609
        )
      )
    )
    OR (${EXPENSE_IS_NUBANK} AND e.data >= DATE '2026-07-25')
    OR (${EXPENSE_IS_ITAU} AND e.data >= DATE '2026-08-14')
  )
`;

export const incomeInTrackingWindow = sql`
  (
    NOT (${INCOME_IS_MERCADO_PAGO} OR ${INCOME_IS_NUBANK} OR ${INCOME_IS_ITAU})
    OR (${INCOME_IS_MERCADO_PAGO} AND i.data >= DATE '2026-08-12')
    OR (${INCOME_IS_NUBANK} AND i.data >= DATE '2026-07-25')
    OR (${INCOME_IS_ITAU} AND i.data >= DATE '2026-08-14')
  )
`;

const OPEN_CONNECTED_CARD_INVOICE = sql`
  (
    COALESCE(e.origem, '') = 'pluggy'
    AND ${CREDIT_CARD_PURCHASE}
    AND (${EXPENSE_IS_MERCADO_PAGO} OR ${EXPENSE_IS_NUBANK})
    AND e.competencia_ano IS NOT NULL
    AND e.competencia_mes IS NOT NULL
    AND (
      e.competencia_ano * 12 + e.competencia_mes
    ) = (
      EXTRACT(YEAR FROM CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::int * 12
      + EXTRACT(MONTH FROM CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::int
      + 1
    )
  )
`;

const EXPENSE_CARD_LEDGER_ADJUSTMENT = sql`
  COALESCE(e.observacoes, '') ILIKE '%movimento neutro de cartão%'
`;

const INCOME_CARD_LEDGER_ADJUSTMENT = sql`
  COALESCE(i.nota, '') ILIKE '%movimento neutro de cartão%'
`;

// Resgatar dinheiro de cofrinho/reserva apenas muda onde o patrimônio está.
// A conta corrente recebe o valor, mas isso não é renda nova.
const INCOME_OWN_RESERVE_TRANSFER = sql`
  (
    ${INCOME_IS_MERCADO_PAGO}
    AND COALESCE(i.tipo, '') ~* '(dinheiro retirado|resgate).*(bol[aã]o|cofrinho|reserva)'
  )
`;

const EXPENSE_OWN_RESERVE_TRANSFER = sql`
  (
    ${EXPENSE_IS_MERCADO_PAGO}
    AND COALESCE(e.tipo, '') ~* '(dinheiro (guardado|reservado)|aplica[cç][aã]o).*(bol[aã]o|cofrinho|reserva)'
  )
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
 * Gastos e atividades pertencem à data em que aconteceram. A competência da
 * fatura continua armazenada para a dívida do cartão, mas não desloca uma
 * compra feita em agosto para a lista de setembro.
 */
export const expenseInPeriod = (month: number, year: number) => sql`
  EXTRACT(MONTH FROM e.data) = ${month}
  AND EXTRACT(YEAR FROM e.data) = ${year}
`;

export const expensePeriodMonth = sql`
  EXTRACT(MONTH FROM e.data)::int
`;

export const expensePeriodYear = sql`
  EXTRACT(YEAR FROM e.data)::int
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
    AND (e.competencia_ano * 12 + e.competencia_mes) > (
      EXTRACT(YEAR FROM CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::int * 12
      + EXTRACT(MONTH FROM CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::int
    )
    AND NOT ${OPEN_CONNECTED_CARD_INVOICE}
  )
`;

export const incomeIsRealized = sql`
  i.data <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date
`;

/** Movimentos reais/projetados, sem pagamentos e ajustes neutros. */
export const expenseCountsForForecast = sql`
  ${expenseInTrackingWindow}
  AND NOT (
    ${CARD_PAYMENT}
    OR ${EXPENSE_CARD_LEDGER_ADJUSTMENT}
    OR ${EXPENSE_OWN_RESERVE_TRANSFER}
    OR ${EXPENSE_INTERNAL_TRANSFER}
  )
`;

export const incomeCountsForForecast = sql`
  ${incomeInTrackingWindow}
  AND NOT (
    ${INCOME_CARD_LEDGER_ADJUSTMENT}
    OR ${INCOME_OWN_RESERVE_TRANSFER}
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
