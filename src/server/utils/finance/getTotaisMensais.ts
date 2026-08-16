import { sql } from 'drizzle-orm'
import db from '@/server/db/drizzle'
import {
    expenseCountsForAnalytics,
    expensePeriodMonth,
    expensePeriodYear,
    incomeCountsForAnalytics,
} from './analyticsFilters'

interface MensalRow {
    mes: number
    total: string | number
}

interface TotaisMensaisResult {
    receitas: Array<{ mes: number; total: number }>
    despesas: Array<{ mes: number; total: number }>
}

export const getTotaisMensais = async (
    user_id: string,
    ano = new Date().getFullYear()
): Promise<TotaisMensaisResult> => {
    const [receitas, despesas] = await Promise.all([
        db.execute(sql`
            SELECT EXTRACT(MONTH FROM i.data) as mes, SUM(i.quantidade) as total
            FROM incomes i
            WHERE i.user_id = ${user_id}
              AND EXTRACT(YEAR FROM i.data) = ${ano}
              AND ${incomeCountsForAnalytics}
            GROUP BY mes ORDER BY mes
        `),
        db.execute(sql`
            SELECT ${expensePeriodMonth} as mes, SUM(e.quantidade) as total
            FROM expenses e
            WHERE e.user_id = ${user_id}
              AND ${expensePeriodYear} = ${ano}
              AND ${expenseCountsForAnalytics}
            GROUP BY mes ORDER BY mes
        `),
    ])

    const receitasMap = new Map(
        (receitas.rows as unknown as MensalRow[]).map((row) => [Number(row.mes), Number(row.total)])
    )
    const despesasMap = new Map(
        (despesas.rows as unknown as MensalRow[]).map((row) => [Number(row.mes), Number(row.total)])
    )

    return {
        receitas: Array.from({ length: 12 }, (_, index) => ({
            mes: index + 1,
            total: receitasMap.get(index + 1) ?? 0,
        })),
        despesas: Array.from({ length: 12 }, (_, index) => ({
            mes: index + 1,
            total: despesasMap.get(index + 1) ?? 0,
        })),
    }
}
