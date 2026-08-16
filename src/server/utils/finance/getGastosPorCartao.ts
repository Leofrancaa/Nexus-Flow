import { sql } from 'drizzle-orm'
import db from '@/server/db/drizzle'
import { expenseCountsForAnalytics, expenseInPeriod } from './analyticsFilters'

export interface GastosPorCartaoResult {
    cartao: string
    total: number
}

interface RawRow {
    cartao: string
    total: string | number
}

export const getGastosPorCartao = async (
    user_id: string,
    mes: number,
    ano: number
): Promise<GastosPorCartaoResult[]> => {
    const result = await db.execute(sql`
        SELECT c.nome AS cartao, SUM(e.quantidade) AS total
        FROM expenses e
        JOIN cards c ON e.card_id = c.id
        WHERE e.user_id = ${user_id}
        AND ${expenseInPeriod(mes, ano)}
        AND ${expenseCountsForAnalytics}
        GROUP BY c.nome
        ORDER BY total DESC
    `)
    const rows = result.rows as unknown as RawRow[]

    return rows.map((row: RawRow) => ({ cartao: row.cartao, total: Number(row.total) }))
}
