import { sql } from 'drizzle-orm'
import db from '@/server/db/drizzle'
import {
    expenseCountsForAnalytics,
    expenseInPeriod,
    incomeCountsForAnalytics,
} from './analyticsFilters'

interface TotalRow {
    total: string | number
}

interface ComparativoMensalResult {
    receitas: { atual: number; anterior: number }
    despesas: { atual: number; anterior: number }
    saldo: number
}

export const getComparativoMensal = async (
    user_id: string,
    mesAtual: number,
    anoAtual: number
): Promise<ComparativoMensalResult> => {
    const mesAnterior = mesAtual === 1 ? 12 : mesAtual - 1
    const anoAnterior = mesAtual === 1 ? anoAtual - 1 : anoAtual

    const [receitaAtual, receitaAnterior, despesaAtual, despesaAnterior] = await Promise.all([
        db.execute(sql`
            SELECT COALESCE(SUM(i.quantidade), 0) as total FROM incomes i
            WHERE i.user_id = ${user_id} AND EXTRACT(MONTH FROM i.data) = ${mesAtual} AND EXTRACT(YEAR FROM i.data) = ${anoAtual}
              AND ${incomeCountsForAnalytics}
        `),
        db.execute(sql`
            SELECT COALESCE(SUM(i.quantidade), 0) as total FROM incomes i
            WHERE i.user_id = ${user_id} AND EXTRACT(MONTH FROM i.data) = ${mesAnterior} AND EXTRACT(YEAR FROM i.data) = ${anoAnterior}
              AND ${incomeCountsForAnalytics}
        `),
        db.execute(sql`
            SELECT COALESCE(SUM(e.quantidade), 0) as total FROM expenses e
            WHERE e.user_id = ${user_id} AND ${expenseInPeriod(mesAtual, anoAtual)}
              AND ${expenseCountsForAnalytics}
        `),
        db.execute(sql`
            SELECT COALESCE(SUM(e.quantidade), 0) as total FROM expenses e
            WHERE e.user_id = ${user_id} AND ${expenseInPeriod(mesAnterior, anoAnterior)}
              AND ${expenseCountsForAnalytics}
        `),
    ])

    const total = (r: { rows: unknown[] }): number =>
        Number((r.rows[0] as TotalRow | undefined)?.total ?? 0)

    const receitasAtuais = total(receitaAtual)
    const despesasAtuais = total(despesaAtual)

    return {
        receitas: {
            atual: receitasAtuais,
            anterior: total(receitaAnterior),
        },
        despesas: {
            atual: despesasAtuais,
            anterior: total(despesaAnterior),
        },
        saldo: receitasAtuais - despesasAtuais,
    }
}
