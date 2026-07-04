import { eq } from 'drizzle-orm'
import db from '@/server/db/drizzle'
import { categories } from '@/server/db/schema'
import { chatJson } from '@/server/services/llmService'
import { normalize, formatCurrency, formatDate, isValidDateString } from '@/server/utils/helper'
import { parseAmount } from '@/server/utils/import/types'
import { ExpenseService } from './expenseService'
import { IncomeService } from './incomeService'

/**
 * Camada de AÇÕES do assistente: detecta pedidos de lançamento na mensagem
 * ("gastei 50 no mercado", "adiciona uma receita de 200") e executa via os
 * services normais. Extensível: novas ações entram em ChatAction + executeAction.
 *
 * Fluxo (pensado para custo/latência):
 *   1. Pré-filtro por regex — mensagens sem cara de comando nem chamam a LLM.
 *   2. UMA chamada de classificação (chatJson) extrai a intenção estruturada.
 *   3. Execução direta no service + resposta TEMPLATADA (sem 2ª chamada de LLM).
 * Qualquer falha inesperada devolve null e a conversa segue no fluxo normal.
 */

type ChatAction = 'create_expense' | 'create_income' | 'none'

interface ParsedIntent {
  action?: ChatAction
  descricao?: string | null
  valor?: number | string | null
  data?: string | null
  categoria?: string | null
  metodo?: string | null
}

// Pré-filtro barato: só gasta a chamada de classificação quando a mensagem
// tem verbo de registro ou relato de gasto/ganho.
const ACTION_HINT =
  /\b(adicion\w*|registr\w*|lan[çc]\w*|cadastr\w*|coloc\w*|anot\w*|inser\w*|cri[ae]\w*|gastei|paguei|comprei|recebi|ganhei|nova\s+despesa|novo\s+gasto|nova\s+receita)\b/i

const METODOS_VALIDOS = new Set(['dinheiro', 'pix', 'debito', 'cartao de credito'])

function formatDateBR(isoDate: string): string {
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y}`
}

async function classifyIntent(message: string, userId: number): Promise<ParsedIntent | null> {
  const userCategories = await db
    .select({ nome: categories.nome, tipo: categories.tipo })
    .from(categories)
    .where(eq(categories.user_id, userId))

  const catDespesa = userCategories.filter((c) => c.tipo === 'despesa').map((c) => c.nome).join(', ')
  const catReceita = userCategories.filter((c) => c.tipo === 'receita').map((c) => c.nome).join(', ')

  const hoje = formatDate(new Date())

  const system =
    'Você extrai comandos de lançamento financeiro de mensagens de um app de finanças pessoais (pt-BR). ' +
    'Responda APENAS com JSON válido, sem comentários.'

  const user =
    `Hoje é ${hoje} (formato YYYY-MM-DD).\n` +
    `Mensagem do usuário: """${message}"""\n\n` +
    'Se a mensagem pede para REGISTRAR/ADICIONAR uma despesa (gasto, compra, pagamento) ' +
    'ou uma receita (ganho, recebimento, salário), responda exatamente neste formato:\n' +
    '{"action":"create_expense" ou "create_income","descricao":"texto curto (ex.: Mercado)",' +
    '"valor":numero ou null,"data":"YYYY-MM-DD" ou null,"categoria":"nome" ou null,' +
    '"metodo":"dinheiro"|"pix"|"debito"|"cartao de credito" ou null}\n' +
    '- "valor" em reais, número (ex.: 50.9); null se o usuário não informou.\n' +
    '- "data": resolva datas relativas (hoje, ontem, sábado passado) a partir da data de hoje; null se não citada.\n' +
    '- "categoria": escolha a mais adequada ENTRE as categorias do usuário abaixo; null se nenhuma servir.\n' +
    '- "metodo": só preencha se o usuário citou como pagou.\n' +
    'Se a mensagem NÃO é um pedido de registro (é pergunta, conversa, pedido de análise), responda {"action":"none"}.\n\n' +
    `Categorias de despesa do usuário: ${catDespesa || '(nenhuma)'}\n` +
    `Categorias de receita do usuário: ${catReceita || '(nenhuma)'}`

  return await chatJson<ParsedIntent>({ system, user, maxTokens: 300 })
}

async function resolveCategoryId(
  userId: number,
  categoriaNome: string | null | undefined,
  tipo: 'despesa' | 'receita'
): Promise<number | null> {
  if (!categoriaNome) return null
  const rows = await db
    .select({ id: categories.id, nome: categories.nome, tipo: categories.tipo })
    .from(categories)
    .where(eq(categories.user_id, userId))

  const alvo = normalize(categoriaNome)
  const match = rows.find((c) => c.tipo === tipo && normalize(c.nome) === alvo)
    ?? rows.find((c) => c.tipo === tipo && normalize(c.nome).includes(alvo))
  return match?.id ?? null
}

async function executeAction(userId: number, intent: ParsedIntent): Promise<string> {
  const isExpense = intent.action === 'create_expense'
  const rotulo = isExpense ? 'despesa' : 'receita'

  const valor = intent.valor != null ? parseAmount(intent.valor) : NaN
  if (Number.isNaN(valor) || valor <= 0) {
    return (
      `Entendi que você quer registrar uma ${rotulo}, mas não consegui identificar o valor. ` +
      `Tenta de novo informando o valor — ex.: "adiciona uma ${rotulo} de 50 reais de mercado".`
    )
  }

  const metodoNorm = intent.metodo ? normalize(intent.metodo) : ''
  if (isExpense && metodoNorm.includes('credito')) {
    return (
      'Despesas no cartão de crédito envolvem fatura, competência e parcelas, então por aqui eu não registro. ' +
      'Use o botão + na tela de Despesas e selecione o cartão. 😉'
    )
  }

  const data = intent.data && isValidDateString(intent.data) ? intent.data : formatDate(new Date())
  const descricao = (intent.descricao ?? '').trim().slice(0, 120) || (intent.categoria ?? 'Lançamento via assistente')
  const categoryId = await resolveCategoryId(userId, intent.categoria, isExpense ? 'despesa' : 'receita')

  try {
    if (isExpense) {
      const metodo = METODOS_VALIDOS.has(metodoNorm) ? metodoNorm : 'dinheiro'
      await ExpenseService.createExpense(
        {
          metodo_pagamento: metodo,
          tipo: descricao,
          quantidade: valor,
          data,
          fixo: false,
          category_id: categoryId ?? undefined,
        },
        userId
      )
    } else {
      await IncomeService.createIncome(
        {
          tipo: descricao,
          quantidade: valor,
          data,
          fonte: 'Assistente',
          fixo: false,
          category_id: categoryId ?? undefined,
        },
        userId
      )
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'erro inesperado'
    return `Não consegui registrar a ${rotulo}: ${msg}`
  }

  const catInfo = categoryId && intent.categoria ? ` na categoria ${intent.categoria}` : ''
  const tela = isExpense ? 'Despesas' : 'Receitas'
  return (
    `✅ ${isExpense ? 'Despesa' : 'Receita'} registrada: "${descricao}" — ${formatCurrency(valor)}` +
    `${catInfo}, em ${formatDateBR(data)}. Você pode ver e editar na tela de ${tela}.`
  )
}

/**
 * Tenta tratar a mensagem como um comando de lançamento.
 * Retorna a resposta pronta quando a ação foi tratada, ou null para o chat
 * seguir o fluxo conversacional normal.
 */
export async function tryHandleChatAction(userId: number, message: string): Promise<string | null> {
  if (!ACTION_HINT.test(message)) return null

  let intent: ParsedIntent | null
  try {
    intent = await classifyIntent(message, userId)
  } catch {
    // Classificação falhou (LLM fora do ar, JSON inválido) — segue o chat normal.
    return null
  }

  if (!intent || intent.action !== 'create_expense' && intent.action !== 'create_income') {
    return null
  }

  return await executeAction(userId, intent)
}
