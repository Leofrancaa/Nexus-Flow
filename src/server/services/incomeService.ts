import { and, eq, gte, sql } from 'drizzle-orm'
import db from '@/server/db/drizzle'
import { incomes } from '@/server/db/schema'
import {
    Income,
    CreateIncomeRequest,
} from '@/server/types/index'
import {
    formatDate,
    getLastDayOfMonth,
    createErrorResponse
} from '@/server/utils/helper'
import {
    incomeCountsForAnalytics,
    incomeInTrackingWindow,
    incomeIsRealized,
} from '@/server/utils/finance/analyticsFilters'

interface IncomeWithCategory extends Income {
    categoria_nome?: string
    cor_categoria?: string
    conta_nome?: string
    instituicao_nome?: string
    instituicao_id?: number
}

interface IncomeStatsResult {
    total: string
    fixas: string
    transacoes: string
    media: string
}

export class IncomeService {
    static async createIncome(
        incomeData: CreateIncomeRequest,
        userId: string
    ): Promise<Income | Income[]> {
        const {
            tipo,
            quantidade,
            data,
            fonte,
            fixo = false,
            category_id
        } = incomeData

        const nota = incomeData.nota ?? incomeData.observacoes

        const formattedBaseDate = data || formatDate(new Date())

        const [result] = await db
            .insert(incomes)
            .values({
                tipo,
                quantidade: String(quantidade),
                nota: nota || null,
                data: new Date(`${formattedBaseDate}T12:00:00`),
                fonte: fonte || null,
                fixo,
                user_id: userId,
                category_id: category_id || null,
            })
            .returning()

        const baseIncome = this.mapToIncome(result)

        if (fixo) {
            const replicatedIncomes = await this.replicateFixedIncome(baseIncome, formattedBaseDate, userId)
            return [baseIncome, ...replicatedIncomes]
        }

        return baseIncome
    }

    private static async replicateFixedIncome(
        baseIncome: Income,
        baseDateString: string,
        userId: string
    ): Promise<Income[]> {
        const baseDate = new Date(`${baseDateString}T12:00:00`)
        const diaOriginal = baseDate.getDate()
        const mesOriginal = baseDate.getMonth()
        const ano = baseDate.getFullYear()
        const ehUltimoDiaMes = diaOriginal === 31

        const replicatedIncomes: Income[] = []

        for (let mes = mesOriginal + 1; mes <= 11; mes++) {
            const novaData = new Date(ano, mes, 1)
            const ultimoDiaDoMes = getLastDayOfMonth(novaData)

            const diaAjustado = ehUltimoDiaMes ? ultimoDiaDoMes : Math.min(diaOriginal, ultimoDiaDoMes)
            const dataRep = formatDate(new Date(ano, mes, diaAjustado))

            const [result] = await db
                .insert(incomes)
                .values({
                    tipo: baseIncome.tipo,
                    quantidade: String(baseIncome.quantidade),
                    nota: baseIncome.nota || null,
                    data: new Date(`${dataRep}T12:00:00`),
                    fonte: baseIncome.fonte || null,
                    fixo: true,
                    user_id: userId,
                    category_id: baseIncome.category_id || null,
                })
                .returning()

            replicatedIncomes.push(this.mapToIncome(result))
        }

        return replicatedIncomes
    }

    static async getIncomesByDateRange(
        userId: string,
        startDate: string,
        endDate: string
    ): Promise<IncomeWithCategory[]> {
        const queryResult = await db.execute(sql`
            SELECT
                i.*,
                c.nome AS categoria_nome,
                c.cor AS cor_categoria,
                pa.nome AS conta_nome,
                pi.connector_name AS instituicao_nome,
                pi.connector_id AS instituicao_id
            FROM incomes i
            LEFT JOIN categories c ON i.category_id = c.id
            LEFT JOIN pluggy_accounts pa
              ON pa.account_id = i.pluggy_account_id AND pa.user_id = i.user_id
            LEFT JOIN pluggy_items pi
              ON pi.item_id = pa.item_id AND pi.user_id = i.user_id
            WHERE i.user_id = ${userId}
              AND i.data >= ${startDate}::date
              AND i.data <= ${endDate}::date
              AND ${incomeInTrackingWindow}
              AND ${incomeIsRealized}
            ORDER BY i.data DESC
        `)

        return (queryResult.rows as Array<Record<string, unknown>>).map((row) => ({
            ...row,
            quantidade: Number(row.quantidade),
            data: row.data instanceof Date ? formatDate(row.data as Date) : row.data,
        })) as IncomeWithCategory[]
    }

    static async getIncomesByMonthYear(
        userId: string,
        month: number,
        year: number
    ): Promise<IncomeWithCategory[]> {
        const queryResult = await db.execute(sql`
            SELECT
                i.*,
                c.nome AS categoria_nome,
                c.cor AS cor_categoria,
                pa.nome AS conta_nome,
                pi.connector_name AS instituicao_nome,
                pi.connector_id AS instituicao_id
            FROM incomes i
            LEFT JOIN categories c ON i.category_id = c.id
            LEFT JOIN pluggy_accounts pa
              ON pa.account_id = i.pluggy_account_id AND pa.user_id = i.user_id
            LEFT JOIN pluggy_items pi
              ON pi.item_id = pa.item_id AND pi.user_id = i.user_id
            WHERE i.user_id = ${userId}
              AND EXTRACT(MONTH FROM i.data) = ${month}
              AND EXTRACT(YEAR FROM i.data) = ${year}
              AND ${incomeInTrackingWindow}
              AND ${incomeIsRealized}
            ORDER BY i.data DESC
        `)

        return (queryResult.rows as Array<Record<string, unknown>>).map((row) => ({
            ...row,
            quantidade: Number(row.quantidade),
            data: row.data instanceof Date ? formatDate(row.data as Date) : row.data,
        })) as IncomeWithCategory[]
    }

    static async updateIncome(
        incomeId: number,
        updateData: Partial<CreateIncomeRequest>,
        userId: string
    ): Promise<Income> {
        const [exists] = await db
            .select()
            .from(incomes)
            .where(and(eq(incomes.id, incomeId), eq(incomes.user_id, userId)))
            .limit(1)

        if (!exists) {
            throw createErrorResponse("Receita não encontrada.", 404)
        }

        const notaAtualizada = updateData.nota ?? updateData.observacoes
        const isSynced = exists.origem === "pluggy"

        const setData = {
            ...(!isSynced && updateData.tipo !== undefined ? { tipo: updateData.tipo } : {}),
            ...(!isSynced && updateData.quantidade !== undefined ? { quantidade: String(updateData.quantidade) } : {}),
            ...(notaAtualizada !== undefined ? { nota: notaAtualizada } : {}),
            ...(!isSynced && updateData.data !== undefined ? { data: new Date(`${updateData.data}T12:00:00`) } : {}),
            ...(!isSynced && updateData.fonte !== undefined ? { fonte: updateData.fonte } : {}),
            ...(updateData.category_id !== undefined ? { category_id: updateData.category_id } : {}),
            ...(isSynced && updateData.category_id !== undefined ? { categoria_manual: true } : {}),
        }

        if (Object.keys(setData).length === 0) {
            return this.mapToIncome(exists as unknown as Record<string, unknown>)
        }

        const [result] = await db
            .update(incomes)
            .set(setData)
            .where(eq(incomes.id, incomeId))
            .returning()

        return this.mapToIncome(result)
    }

    static async deleteIncome(incomeId: number, userId: string): Promise<Income | Income[]> {
        const [income] = await db
            .select()
            .from(incomes)
            .where(and(eq(incomes.id, incomeId), eq(incomes.user_id, userId)))
            .limit(1)

        if (!income) {
            throw createErrorResponse("Receita não encontrada.", 404)
        }

        if (income.origem === "pluggy") {
            throw createErrorResponse(
                "Movimentos importados pelo banco não podem ser excluídos. Ajuste a categoria se necessário.",
                400
            )
        }

        if (income.fixo) {
            // Mesmo critério do deleteExpense: remove apenas as réplicas desta
            // receita fixa (mesmo tipo e valor) desta data em diante — réplicas
            // passadas e receitas homônimas de outro valor são preservadas.
            const fixedConditions = and(
                eq(incomes.user_id, userId),
                eq(incomes.tipo, income.tipo),
                eq(incomes.quantidade, income.quantidade),
                eq(incomes.fixo, true),
                gte(incomes.data, income.data)
            )

            const deleted = await db.select().from(incomes).where(fixedConditions)
            await db.delete(incomes).where(fixedConditions)

            return deleted.map((d) => this.mapToIncome(d as unknown as Record<string, unknown>))
        }

        await db.delete(incomes).where(eq(incomes.id, incomeId))

        return this.mapToIncome(income as unknown as Record<string, unknown>)
    }

    static async getIncomeStats(
        userId: string,
        month: number,
        year: number,
        categoryId?: number | undefined
    ): Promise<IncomeStatsResult> {
        const categoryFilter = categoryId ? sql`AND i.category_id = ${categoryId}` : sql``

        const queryResult = await db.execute(sql`
            SELECT
                COALESCE(SUM(i.quantidade), 0) AS total,
                COALESCE(SUM(CASE WHEN i.fixo = true THEN i.quantidade ELSE 0 END), 0) AS fixas,
                COUNT(*) AS transacoes,
                COALESCE(AVG(i.quantidade), 0) AS media
            FROM incomes i
            WHERE i.user_id = ${userId}
              AND EXTRACT(MONTH FROM i.data) = ${month}
              AND EXTRACT(YEAR FROM i.data) = ${year}
              AND ${incomeCountsForAnalytics}
              ${categoryFilter}
        `)

        return queryResult.rows[0] as unknown as IncomeStatsResult
    }

    static async getMonthlyTotal(userId: string, month: number, year: number): Promise<number> {
        const queryResult = await db.execute(sql`
            SELECT COALESCE(SUM(i.quantidade), 0) AS total
            FROM incomes i
            WHERE i.user_id = ${userId}
              AND EXTRACT(MONTH FROM i.data) = ${month}
              AND EXTRACT(YEAR FROM i.data) = ${year}
              AND ${incomeCountsForAnalytics}
        `)

        return parseFloat((queryResult.rows[0] as { total: string }).total)
    }

    static async getTotalByCategory(
        userId: string,
        categoryId: number,
        month: number,
        year: number
    ): Promise<number> {
        const queryResult = await db.execute(sql`
            SELECT COALESCE(SUM(i.quantidade), 0) AS total
            FROM incomes i
            WHERE i.user_id = ${userId}
              AND i.category_id = ${categoryId}
              AND EXTRACT(MONTH FROM i.data) = ${month}
              AND EXTRACT(YEAR FROM i.data) = ${year}
              AND ${incomeCountsForAnalytics}
        `)

        return parseFloat((queryResult.rows[0] as { total: string }).total)
    }

    static async getIncomesGroupedByMonth(
        userId: string,
        year: number = new Date().getFullYear()
    ): Promise<Array<{ mes: string; total: number }>> {
        const queryResult = await db.execute(sql`
            SELECT
                EXTRACT(MONTH FROM i.data) AS numero_mes,
                SUM(i.quantidade) AS total
            FROM incomes i
            WHERE i.user_id = ${userId}
              AND EXTRACT(YEAR FROM i.data) = ${year}
              AND ${incomeCountsForAnalytics}
            GROUP BY numero_mes
            ORDER BY numero_mes
        `)

        const result = queryResult.rows as unknown as Array<{ numero_mes: number; total: string }>
        const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

        return meses.map((mes, index) => {
            const encontrado = result.find((r) => Number(r.numero_mes) === index + 1)
            return { mes, total: encontrado ? Number(encontrado.total) : 0 }
        })
    }

    static async getCategoryResume(
        userId: string,
        month: number,
        year: number
    ): Promise<Array<{
        nome: string
        cor: string
        quantidade: number
        total: number
        percentual: number
    }>> {
        const queryResult = await db.execute(sql`
            SELECT
                c.nome,
                c.cor,
                COUNT(i.id) as quantidade,
                SUM(i.quantidade) as total
            FROM incomes i
            JOIN categories c ON c.id = i.category_id
            WHERE i.user_id = ${userId}
              AND EXTRACT(MONTH FROM i.data) = ${month}
              AND EXTRACT(YEAR FROM i.data) = ${year}
              AND ${incomeCountsForAnalytics}
            GROUP BY c.nome, c.cor
        `)

        const result = queryResult.rows as unknown as Array<{
            nome: string
            cor: string
            quantidade: string
            total: string
        }>

        const totalGeral = result.reduce((acc, r) => acc + Number(r.total), 0)

        return result.map((r) => ({
            nome: r.nome,
            cor: r.cor,
            quantidade: Number(r.quantidade),
            total: Number(r.total),
            percentual: totalGeral > 0 ? (Number(r.total) / totalGeral) * 100 : 0,
        }))
    }

    private static mapToIncome(row: Record<string, unknown>): Income {
        return {
            ...row,
            quantidade: Number(row.quantidade),
            data: row.data instanceof Date ? formatDate(row.data as Date) : row.data,
        } as Income
    }
}
