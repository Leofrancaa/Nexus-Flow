import { sql } from 'drizzle-orm'

import db from '@/server/db/drizzle'

export interface SaldoConectado {
  total: number
  investimentos: number
  produtos: number
}

/** Dinheiro informado pelas instituições, incluindo cofrinhos/investimentos. */
export async function getSaldoConectado(userId: string): Promise<SaldoConectado> {
  const result = await db.execute(sql`
    SELECT
      COALESCE(SUM(saldo) FILTER (WHERE type IN ('BANK', 'INVESTMENT')), 0) AS total,
      COALESCE(SUM(saldo) FILTER (WHERE type = 'INVESTMENT'), 0) AS investimentos,
      COUNT(*) FILTER (WHERE type IN ('BANK', 'INVESTMENT'))::int AS produtos
    FROM pluggy_accounts
    WHERE user_id = ${userId}
  `)
  const row = result.rows[0] as
    | { total?: string | number; investimentos?: string | number; produtos?: string | number }
    | undefined

  return {
    total: Number(row?.total ?? 0),
    investimentos: Number(row?.investimentos ?? 0),
    produtos: Number(row?.produtos ?? 0),
  }
}
