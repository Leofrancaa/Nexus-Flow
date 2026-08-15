import { sql } from 'drizzle-orm'
import db from '@/server/db/drizzle'
import { expenseCountsForAnalytics } from './analyticsFilters'

export interface TopCategoriasResult {
    nome: string
    total: number
}

interface RawRow {
    nome: string
    total: string | number
}

export const getTopCategoriasGasto = async (
    user_id: string,
    mes: number,
    ano: number
): Promise<TopCategoriasResult[]> => {
    const result = await db.execute(sql`
        SELECT c.nome, SUM(e.quantidade) AS total
        FROM expenses e
        JOIN categories c ON e.category_id = c.id
        WHERE e.user_id = ${user_id}
        AND EXTRACT(MONTH FROM e.data) = ${mes}
        AND EXTRACT(YEAR FROM e.data) = ${ano}
        AND ${expenseCountsForAnalytics}
        GROUP BY c.nome
        ORDER BY total DESC
        LIMIT 5
    `)
    const rows = result.rows as unknown as RawRow[]

    return rows.map((row: RawRow) => ({ nome: row.nome, total: Number(row.total) }))
}
