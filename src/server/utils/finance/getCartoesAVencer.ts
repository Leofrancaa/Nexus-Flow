import { sql } from 'drizzle-orm'
import db from '@/server/db/drizzle'

export interface CartoesAVencerResult {
    id: number
    nome: string
    limite: number
    limite_disponivel: number
    total_gasto: number
    dia_vencimento: number
}

interface RawRow {
    id: number
    nome: string
    limite: string | number
    limite_disponivel: string | number
    total_gasto: string | number
    dia_vencimento: number
}

export const getCartoesAVencer = async (user_id: string): Promise<CartoesAVencerResult[]> => {
    const result = await db.execute(sql`
        SELECT
            id, nome, limite, limite_disponivel,
            CASE
              WHEN sincronizado THEN fatura_atual
              ELSE (SELECT COALESCE(SUM(quantidade), 0)
                    FROM expenses
                    WHERE card_id = cards.id AND user_id = ${user_id})
            END AS total_gasto,
            dia_vencimento
        FROM cards
        WHERE user_id = ${user_id}
        ORDER BY dia_vencimento ASC, id DESC
    `)
    const rows = result.rows as unknown as RawRow[]

    return rows.map((row: RawRow) => ({
        id: row.id,
        nome: row.nome,
        limite: Number(row.limite),
        limite_disponivel: Number(row.limite_disponivel),
        total_gasto: Number(row.total_gasto),
        dia_vencimento: row.dia_vencimento,
    }))
}
