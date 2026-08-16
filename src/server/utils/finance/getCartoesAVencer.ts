import { sql } from 'drizzle-orm'
import db from '@/server/db/drizzle'
import {
    brazilDateKey,
    getInvoiceReconciliationWindow,
    reconcileOpenInvoice,
} from './statementReconciliation'

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

export const getCartoesAVencer = async (
    user_id: string,
    referenceDate = new Date()
): Promise<CartoesAVencerResult[]> => {
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

    const today = brazilDateKey(referenceDate)
    return Promise.all(rows.map(async (row: RawRow) => {
        const reconciliationWindow = getInvoiceReconciliationWindow(
          { instituicao: row.instituicao, numero: row.numero },
          referenceDate
        )
        let expensesAfterStatement = 0
        let creditsAfterStatement = 0

        if (reconciliationWindow) {
          const movements = await db.execute(sql`
            SELECT
              COALESCE((
                SELECT SUM(e.quantidade)
                FROM expenses e
                WHERE e.user_id = ${user_id}
                  AND e.card_id = ${row.id}
                  AND e.data > ${reconciliationWindow.statementThrough}::date
                  AND e.data <= ${today}::date
                  AND e.competencia_mes = ${reconciliationWindow.invoiceMonth}
                  AND e.competencia_ano = ${reconciliationWindow.invoiceYear}
              ), 0) AS expenses,
              COALESCE((
                SELECT SUM(i.quantidade)
                FROM incomes i
                JOIN pluggy_accounts account
                  ON account.account_id = i.pluggy_account_id
                 AND account.user_id = i.user_id
                WHERE i.user_id = ${user_id}
                  AND account.card_id = ${row.id}
                  AND i.data > ${reconciliationWindow.statementThrough}::date
                  AND i.data <= ${today}::date
              ), 0) AS credits
          `)
          const movement = movements.rows[0] as
            | { expenses?: string | number; credits?: string | number }
            | undefined
          expensesAfterStatement = Number(movement?.expenses ?? 0)
          creditsAfterStatement = Number(movement?.credits ?? 0)
        }

        const invoice = reconcileOpenInvoice({
          instituicao: row.instituicao,
          numero: row.numero,
          total_gasto: Number(row.total_gasto),
          expensesAfterStatement,
          creditsAfterStatement,
        }, referenceDate)

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
    }))
}
