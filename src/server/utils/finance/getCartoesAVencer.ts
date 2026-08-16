import { sql } from 'drizzle-orm'
import db from '@/server/db/drizzle'
import { reconcileOpenInvoice } from './statementReconciliation'

export interface CartoesAVencerResult {
    id: number
    nome: string
    limite: number
    limite_disponivel: number
    total_gasto: number
    dia_vencimento: number
    instituicao: string | null
    bandeira: string | null
    numero: string
    vencimento_em: string | null
    fechamento_em: string | null
    sincronizado: boolean
    fatura_conciliada: boolean
    referencia_fatura: string | null
}

interface RawRow {
    id: number
    nome: string
    limite: string | number
    limite_disponivel: string | number
    total_gasto: string | number
    dia_vencimento: number
    instituicao: string | null
    bandeira: string | null
    numero: string
    vencimento_em: Date | string | null
    fechamento_em: Date | string | null
    sincronizado: boolean
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
            dia_vencimento, instituicao, bandeira, numero,
            vencimento_em, fechamento_em, sincronizado
        FROM cards
        WHERE user_id = ${user_id}
        ORDER BY dia_vencimento ASC, id DESC
    `)
    const rows = result.rows as unknown as RawRow[]

    return rows.map((row: RawRow) => {
        const invoice = reconcileOpenInvoice({
          instituicao: row.instituicao,
          numero: row.numero,
          total_gasto: Number(row.total_gasto),
        })

        return {
          id: row.id,
          nome: row.nome,
          limite: Number(row.limite),
          limite_disponivel: Number(row.limite_disponivel),
          total_gasto: invoice.amount,
          dia_vencimento: row.dia_vencimento,
          instituicao: row.instituicao,
          bandeira: row.bandeira,
          numero: row.numero,
          vencimento_em: row.vencimento_em
            ? new Date(row.vencimento_em).toISOString().slice(0, 10)
            : null,
          fechamento_em: row.fechamento_em
            ? new Date(row.fechamento_em).toISOString().slice(0, 10)
            : null,
          sincronizado: row.sincronizado,
          fatura_conciliada: invoice.reconciled,
          referencia_fatura: invoice.reference,
        }
    })
}
