import { sql } from 'drizzle-orm'
import db from '@/server/db/drizzle'
import {
    expenseCountsForAnalytics,
    incomeCountsForAnalytics,
} from './analyticsFilters'

/**
 * Saldo do que já aconteceu: soma tudo com data até hoje.
 *
 * O par com `getSaldoFuturo` só faz sentido por causa deste recorte — lá
 * entram também as linhas datadas para a frente, como as parcelas que o app
 * já gravou. Sem o filtro, os dois números eram sempre idênticos e o
 * "saldo futuro" do dashboard não queria dizer nada.
 */
export const getSaldoAtual = async (user_id: string): Promise<number> => {
    const result = await db.execute(sql`
        SELECT
          COALESCE((
            SELECT SUM(i.quantidade) FROM incomes i
            WHERE i.user_id = ${user_id}
              AND i.data <= CURRENT_DATE
              AND ${incomeCountsForAnalytics}
          ), 0) AS receitas,
          COALESCE((
            SELECT SUM(e.quantidade) FROM expenses e
            WHERE e.user_id = ${user_id}
              AND e.data <= CURRENT_DATE
              AND ${expenseCountsForAnalytics}
          ), 0) AS despesas
    `)
    const row = result.rows[0] as { receitas?: string | number; despesas?: string | number } | undefined
    return Number(row?.receitas ?? 0) - Number(row?.despesas ?? 0)
}
