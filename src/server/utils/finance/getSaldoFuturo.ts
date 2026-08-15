import { sql } from 'drizzle-orm'
import db from '@/server/db/drizzle'
import {
    expenseCountsForAnalytics,
    incomeCountsForAnalytics,
} from './analyticsFilters'

/**
 * Saldo projetado: soma tudo, sem recorte de data.
 *
 * Inclui o que ainda vai acontecer e já está lançado — parcela futura de
 * compra no cartão, receita fixa replicada. É o número que responde "se nada
 * mudar, onde eu termino"; o de hoje está em `getSaldoAtual`.
 */
export const getSaldoFuturo = async (user_id: string): Promise<number> => {
    const result = await db.execute(sql`
        SELECT
          COALESCE((
            SELECT SUM(i.quantidade) FROM incomes i
            WHERE i.user_id = ${user_id} AND ${incomeCountsForAnalytics}
          ), 0) AS receitas,
          COALESCE((
            SELECT SUM(e.quantidade) FROM expenses e
            WHERE e.user_id = ${user_id} AND ${expenseCountsForAnalytics}
          ), 0) AS despesas
    `)
    const row = result.rows[0] as { receitas?: string | number; despesas?: string | number } | undefined
    return Number(row?.receitas ?? 0) - Number(row?.despesas ?? 0)
}
