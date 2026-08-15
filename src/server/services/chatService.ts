import { and, eq, asc, desc, sql } from 'drizzle-orm'
import db from '@/server/db/drizzle'
import { chatMessages, plans } from '@/server/db/schema'
import { createErrorResponse, formatCurrency } from '@/server/utils/helper'
import { chatText, isLlmConfigured, ChatMessage } from '@/server/services/llmService'
import { tryHandleChatAction } from '@/server/services/chatActionService'
import { getSaldoAtual } from '@/server/utils/finance/getSaldoAtual'
import { getSaldoConectado } from '@/server/utils/finance/getSaldoConectado'
import { getGastosPorCategoria } from '@/server/utils/finance/getGastosPorCategoria'
import { getComparativoMensal } from '@/server/utils/finance/getComparativoMensal'
import { expenseCountsForAnalytics, incomeCountsForAnalytics } from '@/server/utils/finance/analyticsFilters'
import { getCartoesAVencer } from '@/server/utils/finance/getCartoesAVencer'
import { ThresholdService } from '@/server/services/thresholdService'

const HISTORY_LIMIT = 10
const MAX_MESSAGE_LENGTH = 2000

interface ChatStatus {
  used: number
  remaining: null
  limit: null
  unlimited: true
  configured: boolean
}

interface StoredMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  created_at: Date
}

export class ChatService {
  static async messagesUsedToday(userId: string): Promise<number> {
    const [row] = await db
      .select({ c: sql<number>`count(*)` })
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.user_id, userId),
          eq(chatMessages.role, 'user'),
          sql`${chatMessages.created_at}::date = current_date`
        )
      )
    return Number(row?.c ?? 0)
  }

  static async getStatus(userId: string): Promise<ChatStatus> {
    const used = await this.messagesUsedToday(userId)
    return {
      used,
      remaining: null,
      limit: null,
      unlimited: true,
      configured: isLlmConfigured(),
    }
  }

  static async getHistory(userId: string, limit = 50): Promise<StoredMessage[]> {
    const rows = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.user_id, userId))
      .orderBy(asc(chatMessages.created_at), asc(chatMessages.id))
      .limit(limit)
    return rows as StoredMessage[]
  }

  // Monta um resumo financeiro compacto do usuário para alimentar a IA.
  private static async buildFinancialContext(userId: string): Promise<string> {
    const now = new Date()
    const mes = now.getMonth() + 1
    const ano = now.getFullYear()

    const [
      monthComparison,
      saldoAtual,
      saldoConectado,
      topCategorias,
      biggestResult,
      userPlans,
      historyRows,
      dueCards,
      thresholdAlerts,
      uncategorizedResult,
    ] = await Promise.all([
      getComparativoMensal(userId, mes, ano),
      getSaldoAtual(userId),
      getSaldoConectado(userId),
      getGastosPorCategoria(userId, mes, ano),
      db.execute(sql`
        SELECT e.tipo, e.quantidade, e.data
        FROM expenses e
        WHERE e.user_id = ${userId}
          AND EXTRACT(MONTH FROM e.data) = ${mes}
          AND EXTRACT(YEAR FROM e.data) = ${ano}
          AND ${expenseCountsForAnalytics}
        ORDER BY e.quantidade DESC
        LIMIT 1
      `),
      db
        .select({ nome: plans.nome, meta: plans.meta, total: plans.total_contribuido })
        .from(plans)
        .where(eq(plans.user_id, userId))
        .limit(10),
      db.execute(sql`
        SELECT y, m, SUM(income) AS income, SUM(expense) AS expense
        FROM (
          SELECT EXTRACT(YEAR FROM i.data)::int AS y, EXTRACT(MONTH FROM i.data)::int AS m,
                 i.quantidade AS income, 0 AS expense
            FROM incomes i
            WHERE i.user_id = ${userId}
              AND i.data < date_trunc('month', CURRENT_DATE) + interval '1 month'
              AND ${incomeCountsForAnalytics}
          UNION ALL
          SELECT EXTRACT(YEAR FROM e.data)::int AS y, EXTRACT(MONTH FROM e.data)::int AS m,
                 0 AS income, e.quantidade AS expense
            FROM expenses e
            WHERE e.user_id = ${userId}
              AND e.data < date_trunc('month', CURRENT_DATE) + interval '1 month'
              AND ${expenseCountsForAnalytics}
        ) t
        GROUP BY y, m
        ORDER BY y DESC, m DESC
        LIMIT 6
      `),
      getCartoesAVencer(userId),
      ThresholdService.getThresholdAlerts(userId, mes, ano),
      db.execute(sql`
        SELECT
          (SELECT COUNT(*) FROM expenses e
            WHERE e.user_id = ${userId}
              AND e.category_id IS NULL
              AND EXTRACT(MONTH FROM e.data) = ${mes}
              AND EXTRACT(YEAR FROM e.data) = ${ano}
              AND ${expenseCountsForAnalytics}) AS expenses,
          (SELECT COUNT(*) FROM incomes i
            WHERE i.user_id = ${userId}
              AND i.category_id IS NULL
              AND EXTRACT(MONTH FROM i.data) = ${mes}
              AND EXTRACT(YEAR FROM i.data) = ${ano}
              AND ${incomeCountsForAnalytics}) AS incomes
      `),
    ])

    const monthIncome = monthComparison.receitas.atual
    const monthExpense = monthComparison.despesas.atual
    const biggest = biggestResult.rows[0] as
      | { tipo: string; quantidade: string | number; data: Date | string }
      | undefined
    const monthly = historyRows.rows as Array<{
      y: number
      m: number
      income: string
      expense: string
    }>
    const uncategorized = uncategorizedResult.rows[0] as
      | { expenses?: string | number; incomes?: string | number }
      | undefined

    const mesNome = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

    const lines: string[] = [
      `Mês de referência: ${mesNome}.`,
      `Receitas do mês: ${formatCurrency(monthIncome)}.`,
      `Despesas do mês: ${formatCurrency(monthExpense)}.`,
      `Saldo do mês: ${formatCurrency(monthIncome - monthExpense)}.`,
      saldoConectado.produtos > 0
        ? `Saldo conectado em contas e investimentos: ${formatCurrency(saldoConectado.total)}.`
        : `Saldo calculado pelos lançamentos: ${formatCurrency(saldoAtual)}.`,
    ]

    if (biggest) {
      lines.push(`Maior despesa do mês: ${biggest.tipo} — ${formatCurrency(Number(biggest.quantidade))}.`)
    }

    if (monthly.length > 0) {
      const hist = monthly
        .map((r) => {
          const inc = Number(r.income)
          const exp = Number(r.expense)
          return `${String(r.m).padStart(2, '0')}/${r.y}: receitas ${formatCurrency(inc)}, despesas ${formatCurrency(exp)}, saldo ${formatCurrency(inc - exp)}`
        })
        .join('\n')
      lines.push(`Histórico mensal (últimos 6 meses):\n${hist}`)
    }

    if (topCategorias.length > 0) {
      const top = topCategorias
        .slice(0, 5)
        .map((c) => `${c.nome}: ${formatCurrency(Number(c.total))}`)
        .join('; ')
      lines.push(`Gastos por categoria no mês (maiores primeiro): ${top}.`)
    }

    if (userPlans.length > 0) {
      const planLines = userPlans
        .map((p) => {
          const meta = Number(p.meta)
          const total = Number(p.total)
          const pct = meta > 0 ? Math.round((total / meta) * 100) : 0
          return `${p.nome}: ${pct}% (${formatCurrency(total)} de ${formatCurrency(meta)})`
        })
        .join('; ')
      lines.push(`Planos de investimento: ${planLines}.`)
    }

    if (dueCards.length > 0) {
      const cardsLine = dueCards
        .map((card) =>
          `${card.nome}: fatura em aberto ${formatCurrency(Number(card.total_gasto))}, ` +
          `limite disponível ${formatCurrency(Number(card.limite_disponivel))}`
        )
        .join('; ')
      lines.push(`Cartões: ${cardsLine}.`)
    }

    const concerningAlerts = thresholdAlerts.filter((alert) => alert.alert_level !== 'safe')
    if (concerningAlerts.length > 0) {
      lines.push(
        `Alertas de orçamento: ${concerningAlerts
          .map((alert) => `${alert.category_name} em ${Math.round(alert.percentage_used)}% do limite`)
          .join('; ')}.`
      )
    }

    const uncategorizedCount = Number(uncategorized?.expenses ?? 0) + Number(uncategorized?.incomes ?? 0)
    if (uncategorizedCount > 0) {
      lines.push(`${uncategorizedCount} lançamento(s) real(is) ainda estão sem categoria neste mês.`)
    }

    return lines.join('\n')
  }

  static async sendMessage(
    userId: string,
    message: string
  ): Promise<{ reply: string; status: ChatStatus }> {
    const text = (message ?? '').trim()
    if (!text) throw createErrorResponse('Mensagem vazia.', 400)
    if (text.length > MAX_MESSAGE_LENGTH) {
      throw createErrorResponse(`Mensagem muito longa (máx. ${MAX_MESSAGE_LENGTH} caracteres).`, 400)
    }
    // Comandos de lançamento ("gastei 50 no mercado") são executados de
    // verdade e respondidos com confirmação mesmo sem depender do provedor.
    const actionReply = await tryHandleChatAction(userId, text)
    if (!actionReply && !isLlmConfigured()) {
      throw createErrorResponse(
        'A IA aguarda a chave do Groq na produção. Configure GROQ_API_KEY no Vercel para fazer perguntas; comandos de lançamento continuam disponíveis.',
        503
      )
    }

    const used = await this.messagesUsedToday(userId)
    const reply = actionReply ?? (await this.conversationalReply(userId, text))

    // Persiste a mensagem do usuário e a resposta.
    await db.insert(chatMessages).values([
      { user_id: userId, role: 'user', content: text },
      { user_id: userId, role: 'assistant', content: reply },
    ])

    return {
      reply,
      status: {
        used: used + 1,
        remaining: null,
        limit: null,
        unlimited: true,
        configured: isLlmConfigured(),
      },
    }
  }

  // Fluxo conversacional (perguntas/análises) — responde com base no resumo financeiro.
  private static async conversationalReply(userId: string, text: string): Promise<string> {
    const context = await this.buildFinancialContext(userId)
    const recent = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.user_id, userId))
      .orderBy(desc(chatMessages.created_at), desc(chatMessages.id))
      .limit(HISTORY_LIMIT)

    const history: ChatMessage[] = recent
      .reverse()
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    const system =
      'Você é o assistente financeiro do app Nexus. Responda em português do Brasil, ' +
      'de forma curta, clara e amigável. Use SOMENTE os dados financeiros fornecidos abaixo ' +
      'para responder. Se a informação não estiver nos dados, diga que não tem esse dado. ' +
      'Não invente valores. Dê respostas objetivas e, quando fizer sentido, uma dica prática.\n' +
      'Você TAMBÉM consegue registrar despesas e receitas simples quando o usuário pedir ' +
      '(ex.: "adiciona uma despesa de 50 reais de mercado"). Se o usuário quiser registrar algo, ' +
      'oriente-o a repetir o pedido informando o valor (ex.: "gastei 50 no mercado"). ' +
      'Lançamentos no cartão de crédito devem ser feitos na tela de Despesas.\n\n' +
      'DADOS FINANCEIROS DO USUÁRIO:\n' +
      context

    return await chatText(system, [...history, { role: 'user', content: text }])
  }
}
