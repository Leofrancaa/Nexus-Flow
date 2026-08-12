import { sql } from 'drizzle-orm'
import db from '@/server/db/drizzle'

export interface CartoesAVencerResult {
    id: number
    nome: string
    limite: number
    total_gasto: number
    dia_vencimento: number
}

interface RawRow {
    id: number
    nome: string
    limite: string | number
    total_gasto: string | number
    dia_vencimento: number
}

export const getCartoesAVencer = async (user_id: string): Promise<CartoesAVencerResult[]> => {
    const hoje = new Date()
    const diaHoje = hoje.getDate()

    const dias: number[] = []
    for (let i = 0; i <= 5; i++) {
        const dataTemp = new Date(hoje)
        dataTemp.setDate(diaHoje + i)
        dias.push(dataTemp.getDate())
    }

    // Interpolar o array direto (`${dias}::int[]`) faz o Drizzle emitir
    // `($1, $2, ...)`, que o Postgres lê como record e recusa converter para
    // int[] — "cannot cast type record to integer[]", derrubando o dashboard
    // inteiro em 500. Montando o ARRAY[...] explicitamente cada dia continua
    // sendo um parâmetro ligado, sem concatenação de string na query.
    const listaDias = sql.join(
        dias.map((dia) => sql`${dia}`),
        sql`, `
    )

    const result = await db.execute(sql`
        SELECT
            id, nome, limite,
            (SELECT COALESCE(SUM(quantidade), 0)
             FROM expenses
             WHERE card_id = cards.id AND user_id = ${user_id}) AS total_gasto,
            dia_vencimento
        FROM cards
        WHERE user_id = ${user_id} AND dia_vencimento = ANY(ARRAY[${listaDias}]::int[])
    `)
    const rows = result.rows as unknown as RawRow[]

    return rows.map((row: RawRow) => ({
        id: row.id,
        nome: row.nome,
        limite: Number(row.limite),
        total_gasto: Number(row.total_gasto),
        dia_vencimento: row.dia_vencimento,
    }))
}
