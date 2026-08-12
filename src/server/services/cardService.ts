import { and, eq, sql } from 'drizzle-orm'
import db from '@/server/db/drizzle'
import { cards, expenses, cardInvoicesPayments } from '@/server/db/schema'
import {
    Card,
    CreateCardRequest,
} from '@/server/types/index'
import {
    createErrorResponse,
    isPositiveNumber
} from '@/server/utils/helper'

interface CardWithStats extends Card {
    gasto_total: number
    proximo_vencimento: string
}

export class CardService {
    static async createCard(
        cardData: CreateCardRequest,
        userId: string
    ): Promise<Card> {
        const {
            nome,
            tipo,
            numero,
            cor,
            limite = 0,
            dia_vencimento,
            dias_fechamento_antes = 10
        } = cardData

        if (!numero || numero.length !== 4) {
            throw createErrorResponse("O número do cartão deve conter exatamente 4 dígitos.", 400)
        }

        const isCredito = tipo === 'crédito' || tipo === 'credito'
        const isDebito = tipo === 'débito' || tipo === 'debito'

        if (isCredito) {
            if (!dia_vencimento || dia_vencimento < 1 || dia_vencimento > 31) {
                throw createErrorResponse("O dia de vencimento deve estar entre 1 e 31 para cartões de crédito.", 400)
            }

            if (dias_fechamento_antes != null && (dias_fechamento_antes < 1 || dias_fechamento_antes > 31)) {
                throw createErrorResponse("Dias de fechamento antes deve estar entre 1 e 31.", 400)
            }

            if (!isPositiveNumber(limite)) {
                throw createErrorResponse("Limite deve ser um número positivo para cartões de crédito.", 400)
            }
        }

        const diaVencimentoFinal = isDebito ? 1 : dia_vencimento
        const diasFechamentoAntesFinal = isDebito ? 1 : dias_fechamento_antes

        const [result] = await db
            .insert(cards)
            .values({
                nome,
                tipo,
                numero,
                cor: cor || '#6B7280',
                limite: String(limite),
                limite_disponivel: String(limite),
                dia_vencimento: diaVencimentoFinal!,
                dias_fechamento_antes: diasFechamentoAntesFinal!,
                user_id: userId,
            })
            .returning()

        return this.mapToCard(result)
    }

    static async getCardsByUser(userId: string): Promise<CardWithStats[]> {
        const currentMonth = new Date().getMonth() + 1
        const currentYear = new Date().getFullYear()

        const queryResult = await db.execute(sql`
            SELECT
                c.*,
                COALESCE(SUM(e.quantidade), 0) AS gasto_total
            FROM cards c
            LEFT JOIN expenses e ON e.card_id = c.id
                AND e.user_id = ${userId}
                AND (e.competencia_mes = ${currentMonth} AND e.competencia_ano = ${currentYear})
            WHERE c.user_id = ${userId}
            GROUP BY c.id
            ORDER BY c.id DESC
        `)

        return (queryResult.rows as Array<Record<string, unknown>>).map((card) => {
            const limite = Number(card.limite)
            const gastoTotal = Number(card.gasto_total)
            const limiteDisponivel = Number(card.limite_disponivel)

            return {
                ...card,
                limite,
                limite_disponivel: limiteDisponivel,
                gasto_total: gastoTotal,
                proximo_vencimento: this.getProximoVencimento(Number(card.dia_vencimento)),
            }
        }) as CardWithStats[]
    }

    // Próximo vencimento calculado em JS: o dia é limitado ao último dia do mês
    // (dia 31 em fevereiro vira 28/29) e a virada dez→jan não estoura o mês.
    private static getProximoVencimento(diaVencimento: number): string {
        const hoje = new Date()
        const clampDay = (ano: number, mesIndex: number) =>
            Math.min(diaVencimento, new Date(ano, mesIndex + 1, 0).getDate())

        let ano = hoje.getFullYear()
        let mesIndex = hoje.getMonth()
        let vencimento = new Date(ano, mesIndex, clampDay(ano, mesIndex))

        const hojeSemHora = new Date(ano, mesIndex, hoje.getDate())
        if (hojeSemHora > vencimento) {
            mesIndex += 1
            if (mesIndex > 11) {
                mesIndex = 0
                ano += 1
            }
            vencimento = new Date(ano, mesIndex, clampDay(ano, mesIndex))
        }

        const mm = String(vencimento.getMonth() + 1).padStart(2, '0')
        const dd = String(vencimento.getDate()).padStart(2, '0')
        return `${vencimento.getFullYear()}-${mm}-${dd}`
    }

    static async getCardById(cardId: number, userId: string): Promise<Card | null> {
        const [card] = await db
            .select()
            .from(cards)
            .where(and(eq(cards.id, cardId), eq(cards.user_id, userId)))
            .limit(1)

        return card ? this.mapToCard(card) : null
    }

    static async updateCard(
        cardId: number,
        updateData: Partial<CreateCardRequest>,
        userId: string
    ): Promise<Card> {
        const { nome, tipo, numero, cor, limite, dia_vencimento, dias_fechamento_antes } = updateData

        if (numero && numero.length !== 4) {
            throw createErrorResponse("O número do cartão deve conter exatamente 4 dígitos.", 400)
        }

        if (dia_vencimento && (dia_vencimento < 1 || dia_vencimento > 31)) {
            throw createErrorResponse("O dia de vencimento deve estar entre 1 e 31.", 400)
        }

        if (dias_fechamento_antes != null && (dias_fechamento_antes < 1 || dias_fechamento_antes > 31)) {
            throw createErrorResponse("Dias de fechamento antes deve estar entre 1 e 31.", 400)
        }

        // Checagem de dono ANTES de qualquer update: sem ela, o caminho com
        // "limite" atualizava cartão de outro usuário (o WHERE só filtrava o id).
        const [exists] = await db
            .select()
            .from(cards)
            .where(and(eq(cards.id, cardId), eq(cards.user_id, userId)))
            .limit(1)
        if (!exists) throw createErrorResponse("Cartão não encontrado.", 404)

        if (limite !== undefined) {
            if (!isPositiveNumber(limite)) {
                throw createErrorResponse("Limite deve ser um número positivo.", 400)
            }

            const saldoEmAberto = await this.getSaldoEmAberto(cardId, userId)
            if (Number(limite) < Number(saldoEmAberto)) {
                throw createErrorResponse(
                    `O novo limite não pode ser menor que o saldo em aberto (faturas não pagas): R$ ${saldoEmAberto.toFixed(2)}`,
                    400
                )
            }

            const novoLimiteDisponivel = Math.max(Number(limite) - Number(saldoEmAberto), 0)

            const [result] = await db
                .update(cards)
                .set({
                    ...(nome !== undefined ? { nome } : {}),
                    ...(tipo !== undefined ? { tipo } : {}),
                    ...(numero !== undefined ? { numero } : {}),
                    ...(cor !== undefined ? { cor } : {}),
                    limite: String(limite),
                    limite_disponivel: String(novoLimiteDisponivel),
                    ...(dia_vencimento !== undefined ? { dia_vencimento } : {}),
                    ...(dias_fechamento_antes !== undefined ? { dias_fechamento_antes } : {}),
                })
                .where(and(eq(cards.id, cardId), eq(cards.user_id, userId)))
                .returning()

            return this.mapToCard(result)
        }

        const [result] = await db
            .update(cards)
            .set({
                ...(nome !== undefined ? { nome } : {}),
                ...(tipo !== undefined ? { tipo } : {}),
                ...(numero !== undefined ? { numero } : {}),
                ...(cor !== undefined ? { cor } : {}),
                ...(dia_vencimento !== undefined ? { dia_vencimento } : {}),
                ...(dias_fechamento_antes !== undefined ? { dias_fechamento_antes } : {}),
            })
            .where(and(eq(cards.id, cardId), eq(cards.user_id, userId)))
            .returning()

        return this.mapToCard(result)
    }

    static async deleteCard(cardId: number, userId: string): Promise<{ message: string }> {
        const hasCurrentExpenses = await this.hasCurrentMonthExpenses(cardId, userId)
        if (hasCurrentExpenses) {
            throw createErrorResponse(
                "Este cartão possui despesas vinculadas no mês atual e não pode ser excluído.",
                400
            )
        }

        const hasPastExpenses = await this.hasPastExpenses(cardId, userId)
        if (hasPastExpenses) {
            await this.deleteCardAndExpenses(cardId, userId)
            return { message: "Cartão e todas as despesas anteriores vinculadas a ele foram excluídos com sucesso." }
        }

        const [exists] = await db
            .select()
            .from(cards)
            .where(and(eq(cards.id, cardId), eq(cards.user_id, userId)))
            .limit(1)
        if (!exists) throw createErrorResponse("Cartão não encontrado.", 404)

        await db.delete(cards).where(eq(cards.id, cardId))

        return { message: "Cartão removido com sucesso." }
    }

    static async getSaldoEmAberto(cardId: number, userId: string): Promise<number> {
        const queryResult = await db.execute(sql`
            SELECT COALESCE(SUM(e.quantidade), 0) AS aberto
            FROM expenses e
            LEFT JOIN card_invoices_payments p
                ON p.user_id = e.user_id
                AND p.card_id = e.card_id
                AND p.competencia_mes = e.competencia_mes
                AND p.competencia_ano = e.competencia_ano
            WHERE e.user_id = ${userId}
              AND e.card_id = ${cardId}
              AND p.id IS NULL
        `)

        return Number((queryResult.rows[0] as { aberto: string }).aberto)
    }

    static async hasCurrentMonthExpenses(cardId: number, userId: string): Promise<boolean> {
        const queryResult = await db.execute(sql`
            SELECT COUNT(*) as count FROM expenses
            WHERE card_id = ${cardId} AND user_id = ${userId}
              AND EXTRACT(MONTH FROM data) = EXTRACT(MONTH FROM CURRENT_DATE)
              AND EXTRACT(YEAR FROM data) = EXTRACT(YEAR FROM CURRENT_DATE)
        `)

        return Number((queryResult.rows[0] as { count: string }).count) > 0
    }

    static async hasPastExpenses(cardId: number, userId: string): Promise<boolean> {
        const queryResult = await db.execute(sql`
            SELECT COUNT(*) as count FROM expenses
            WHERE card_id = ${cardId} AND user_id = ${userId}
              AND (EXTRACT(MONTH FROM data) != EXTRACT(MONTH FROM CURRENT_DATE)
                OR EXTRACT(YEAR FROM data) != EXTRACT(YEAR FROM CURRENT_DATE))
        `)

        return Number((queryResult.rows[0] as { count: string }).count) > 0
    }

    static async deleteCardAndExpenses(cardId: number, userId: string): Promise<void> {
        await db.transaction(async (tx) => {
            const [exists] = await tx
                .select()
                .from(cards)
                .where(and(eq(cards.id, cardId), eq(cards.user_id, userId)))
                .limit(1)
            if (!exists) throw createErrorResponse("Cartão não encontrado.", 404)

            await tx.delete(expenses).where(and(eq(expenses.card_id, cardId), eq(expenses.user_id, userId)))
            await tx
                .delete(cardInvoicesPayments)
                .where(and(eq(cardInvoicesPayments.card_id, cardId), eq(cardInvoicesPayments.user_id, userId)))
            await tx.delete(cards).where(eq(cards.id, cardId))
        })
    }

    static async getFutureInstallments(cardId: number, userId: string): Promise<Array<{
        id: number
        tipo: string
        quantidade: number
        competencia_mes: number
        competencia_ano: number
        parcelas: number
        observacoes: string | null
    }>> {
        const now = new Date()
        const currentMonth = now.getMonth() + 1
        const currentYear = now.getFullYear()

        const [card] = await db
            .select()
            .from(cards)
            .where(and(eq(cards.id, cardId), eq(cards.user_id, userId)))
            .limit(1)

        if (!card) throw createErrorResponse("Cartão não encontrado.", 404)

        const queryResult = await db.execute(sql`
            SELECT id, tipo, quantidade, competencia_mes, competencia_ano, parcelas, observacoes
            FROM expenses
            WHERE card_id = ${cardId}
              AND user_id = ${userId}
              AND parcelas IS NOT NULL
              AND fixo = false
              AND (
                  (competencia_ano > ${currentYear})
                  OR (competencia_ano = ${currentYear} AND competencia_mes >= ${currentMonth})
              )
            ORDER BY competencia_ano ASC, competencia_mes ASC
        `)

        const result = queryResult.rows as unknown as Array<{
            id: number
            tipo: string
            quantidade: string
            competencia_mes: number
            competencia_ano: number
            parcelas: number
            observacoes: string | null
        }>

        return result.map((r) => ({
            ...r,
            quantidade: Number(r.quantidade),
        }))
    }

    private static mapToCard(card: Record<string, unknown>): Card {
        return {
            ...card,
            limite: Number(card.limite),
            limite_disponivel: Number(card.limite_disponivel),
        } as Card
    }
}
