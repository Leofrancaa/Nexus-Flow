import { sql } from 'drizzle-orm'
import db from '@/server/db/drizzle'
import {
    expenseCountsForForecast,
    incomeCountsForForecast,
} from './analyticsFilters'

function dateRangeInBrazil(referenceDate: Date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(referenceDate)
    const value = (type: Intl.DateTimeFormatPartTypes) =>
        Number(parts.find((part) => part.type === type)?.value)
    const year = value('year')
    const month = value('month')
    const day = value('day')
    const today = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
    const monthEnd = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
    return { today, monthEnd }
}

/**
 * Projeção até o fim do mês corrente. O cálculo antigo somava todo o histórico
 * e todas as recorrências futuras, produzindo números como R$ 79 mil sem valor
 * prático para a decisão de hoje.
 */
export const getSaldoFuturo = async (
    user_id: string,
    saldoBase = 0,
    referenceDate = new Date()
): Promise<number> => {
    const { today, monthEnd } = dateRangeInBrazil(referenceDate)
    const result = await db.execute(sql`
        SELECT
          COALESCE((
            SELECT SUM(i.quantidade) FROM incomes i
            WHERE i.user_id = ${user_id}
              AND i.data > ${today}::date
              AND i.data <= ${monthEnd}::date
              AND ${incomeCountsForForecast}
          ), 0) AS receitas,
          COALESCE((
            SELECT SUM(e.quantidade) FROM expenses e
            WHERE e.user_id = ${user_id}
              AND e.data > ${today}::date
              AND e.data <= ${monthEnd}::date
              AND ${expenseCountsForForecast}
          ), 0) AS despesas
    `)
    const row = result.rows[0] as { receitas?: string | number; despesas?: string | number } | undefined
    return saldoBase + Number(row?.receitas ?? 0) - Number(row?.despesas ?? 0)
}
