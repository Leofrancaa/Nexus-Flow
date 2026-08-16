import { sql } from 'drizzle-orm'

import db from '@/server/db/drizzle'

export interface SaldoConectado {
  total: number
  investimentos: number
  produtos: number
  mercadoPago: number
  produtosMercadoPago: number
}

/** Dinheiro informado pelas instituições, incluindo cofrinhos/investimentos. */
export async function getSaldoConectado(userId: string): Promise<SaldoConectado> {
  const result = await db.execute(sql`
    SELECT
      COALESCE(SUM(account.saldo) FILTER (WHERE account.type IN ('BANK', 'INVESTMENT')), 0) AS total,
      COALESCE(SUM(account.saldo) FILTER (WHERE account.type = 'INVESTMENT'), 0) AS investimentos,
      COUNT(*) FILTER (WHERE account.type IN ('BANK', 'INVESTMENT'))::int AS produtos,
      CASE
        -- No Mercado Pago, o saldo da conta pode repetir o valor agregado dos
        -- cofrinhos. Quando o produto INVESTMENT existe, ele é a fonte mais
        -- específica e não pode ser somado novamente ao BANK.
        WHEN COUNT(*) FILTER (
          WHERE account.type = 'INVESTMENT'
            AND item.connector_name ILIKE '%mercado pago%'
        ) > 0
        THEN COALESCE(SUM(account.saldo) FILTER (
          WHERE account.type = 'INVESTMENT'
            AND item.connector_name ILIKE '%mercado pago%'
        ), 0)
        ELSE COALESCE(SUM(account.saldo) FILTER (
          WHERE account.type = 'BANK'
            AND item.connector_name ILIKE '%mercado pago%'
        ), 0)
      END AS mercado_pago,
      COUNT(*) FILTER (
        WHERE account.type IN ('BANK', 'INVESTMENT')
          AND item.connector_name ILIKE '%mercado pago%'
      )::int AS produtos_mercado_pago
    FROM pluggy_accounts account
    LEFT JOIN pluggy_items item
      ON item.item_id = account.item_id
     AND item.user_id = account.user_id
    WHERE account.user_id = ${userId}
  `)
  const row = result.rows[0] as
    | {
        total?: string | number
        investimentos?: string | number
        produtos?: string | number
        mercado_pago?: string | number
        produtos_mercado_pago?: string | number
      }
    | undefined

  return {
    total: Number(row?.total ?? 0),
    investimentos: Number(row?.investimentos ?? 0),
    produtos: Number(row?.produtos ?? 0),
    mercadoPago: Number(row?.mercado_pago ?? 0),
    produtosMercadoPago: Number(row?.produtos_mercado_pago ?? 0),
  }
}
