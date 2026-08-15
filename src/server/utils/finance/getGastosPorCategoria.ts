import { sql } from 'drizzle-orm'
import db from '@/server/db/drizzle'
import { expenseCountsForAnalytics } from './analyticsFilters'

export interface GastosPorCategoriaResult {
    id: number
    nome: string
    total: number
}

interface RawRow {
    id: number
    nome: string
    total: string | number
}

export const getGastosPorCategoria = async (
    user_id: string,
    mes: number,
    ano: number
): Promise<GastosPorCategoriaResult[]> => {
    const result = await db.execute(sql`
        SELECT c.id, c.nome, SUM(e.quantidade) as total
        FROM expenses e
        JOIN categories c ON e.category_id = c.id
        WHERE e.user_id = ${user_id}
        AND EXTRACT(MONTH FROM e.data) = ${mes}
        AND EXTRACT(YEAR FROM e.data) = ${ano}
        AND ${expenseCountsForAnalytics}
        GROUP BY c.id, c.nome
        ORDER BY total DESC
    `)
    const rows = result.rows as unknown as RawRow[]

    return rows.map((row: RawRow) => ({ id: row.id, nome: row.nome, total: Number(row.total) }))
}
