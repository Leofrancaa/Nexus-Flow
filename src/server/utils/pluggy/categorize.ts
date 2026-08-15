import { normalize } from '@/server/utils/helper'
import { chatJson, isLlmConfigured } from '@/server/services/llmService'

/**
 * Categorização de transação por descrição.
 *
 * Veio do importador de extrato, que foi removido — as regras abaixo são o
 * resultado de olhar extrato de banco brasileiro de verdade e não valia jogar
 * fora. Passam a ser a base da categorização das transações da Pluggy, que
 * chegam com a mesma cara ("IFD*IFOOD", "PG *POSTO IPIRANGA").
 *
 * Ainda sem chamador: o `pluggySyncService` do bloco 5 é quem vai usá-las.
 */

export interface UserCategory {
  id: number
  nome: string
  tipo: string // 'despesa' | 'receita'
}

export interface CategorizableItem {
  description: string
  type: 'expense' | 'income'
  providerCategory?: string | null
  operationType?: string | null
  merchantName?: string | null
}

// Palavra-chave (sem acento) -> nome genérico de categoria (pt-BR).
const KEYWORD_RULES: Array<{ keywords: string[]; category: string }> = [
  { keywords: ['netflix', 'spotify', 'disney', 'hbo', 'prime video', 'globoplay', 'youtube premium', 'digital services', 'video streaming', 'music streaming'], category: 'assinaturas' },
  { keywords: ['ifood', 'rappi', 'restaurante', 'lanchonete', 'padaria', 'mercado', 'supermercado', 'hortifruti', 'acougue', 'mc donalds', 'burger', 'pizza', 'groceries', 'food and drinks', 'eating out', 'food delivery'], category: 'alimentacao' },
  { keywords: ['uber', '99 ', '99app', 'cabify', 'posto', 'shell', 'ipiranga', 'combustivel', 'estacionamento', 'metro', 'onibus', 'passagem', 'transportation', 'automotive', 'gas stations', 'parking', 'tolls'], category: 'transporte' },
  { keywords: ['aluguel', 'condominio', 'luz', 'energia', 'agua', 'gas', 'enel', 'sabesp', 'imobiliaria', 'housing', 'utilities', 'rent', 'houseware'], category: 'moradia' },
  { keywords: ['farmacia', 'drogaria', 'hospital', 'clinica', 'medico', 'laboratorio', 'plano de saude', 'unimed', 'academia', 'healthcare', 'wellness', 'fitness', 'pharmacy'], category: 'saude' },
  { keywords: ['escola', 'faculdade', 'curso', 'udemy', 'alura', 'coursera', 'livro', 'mensalidade', 'education', 'university', 'school', 'bookstore'], category: 'educacao' },
  { keywords: ['amazon', 'mercado livre', 'mercadolivre', 'shopee', 'aliexpress', 'magazine', 'americanas', 'loja', 'shopping', 'electronics', 'clothing', 'pet supplies'], category: 'compras' },
  { keywords: ['hotel', 'airbnb', 'aereo', 'companhia aerea', 'travel', 'airport', 'airlines', 'accommodation', 'mileage'], category: 'viagens' },
  { keywords: ['imposto', 'ipva', 'iptu', 'receita federal', 'taxes', 'legal obligations'], category: 'impostos' },
  { keywords: ['tarifa', 'anuidade', 'juros', 'bank fees', 'account fees', 'credit card fees', 'encargos_juros'], category: 'taxas bancarias' },
  { keywords: ['seguro', 'insurance'], category: 'seguros' },
  { keywords: ['transfer', 'pix enviado', 'ted enviada', 'doc enviado', 'boleto', 'credit card payment'], category: 'transferencias' },
  { keywords: ['vivo', 'claro', 'tim', 'oi ', 'internet', 'telefone', 'celular', 'telecommunications', 'services'], category: 'servicos' },
  { keywords: ['cinema', 'show', 'bar ', 'steam', 'playstation', 'xbox', 'leisure', 'gambling', 'lottery'], category: 'lazer' },
]

const INCOME_RULES: Array<{ keywords: string[]; category: string }> = [
  { keywords: ['salario', 'folha_pagamento', 'folha pagamento', 'salary'], category: 'salario' },
  { keywords: ['freelance', 'honorario', 'entrepreneurial activities'], category: 'freelance' },
  { keywords: ['rendimento', 'dividendo', 'juros recebidos', 'proceeds interests', 'fixed income', 'investment'], category: 'rendimentos' },
  { keywords: ['cashback', 'estorno', 'reembolso'], category: 'reembolsos' },
  { keywords: ['pix recebido', 'transferencia recebida', 'ted recebida', 'doc recebida', 'same person transfer', 'transfers'], category: 'transferencias' },
]

function resolveCategory(
  generic: string,
  userCategories: UserCategory[],
  tipo: 'despesa' | 'receita'
): number | null {
  const target = normalize(generic)
  const match = userCategories.find(
    (c) => c.tipo === tipo && (normalize(c.nome) === target || normalize(c.nome).includes(target))
  )
  return match?.id ?? null
}

// Categorização por regras (grátis, sem IA). Retorna id da categoria ou null.
export function categorizeByRules(
  item: CategorizableItem,
  userCategories: UserCategory[]
): number | null {
  const desc = normalize(
    [item.description, item.merchantName, item.providerCategory, item.operationType]
      .filter(Boolean)
      .join(' ')
  )
  const rules = item.type === 'income' ? INCOME_RULES : KEYWORD_RULES
  const tipo = item.type === 'income' ? 'receita' : 'despesa'

  for (const rule of rules) {
    if (rule.keywords.some((k) => desc.includes(normalize(k)))) {
      const id = resolveCategory(rule.category, userCategories, tipo)
      if (id) return id
    }
  }
  return resolveCategory(
    item.type === 'income' ? 'outros rendimentos' : 'outros',
    userCategories,
    tipo
  )
}

/**
 * Categoriza com a LLM os itens que as regras não resolveram.
 * Recebe os índices originais para devolver um mapa index -> category_id.
 * Falha silenciosamente (retorna {}) se a IA não estiver configurada.
 */
export async function categorizeWithLlm(
  items: Array<{ index: number; description: string; type: 'expense' | 'income' }>,
  userCategories: UserCategory[]
): Promise<Record<number, number>> {
  if (!isLlmConfigured() || items.length === 0 || userCategories.length === 0) return {}

  const catList = userCategories
    .map((c) => `${c.id}: ${c.nome} (${c.tipo})`)
    .join('\n')

  const txList = items
    .map((it) => `${it.index}: [${it.type === 'income' ? 'entrada' : 'saida'}] ${it.description}`)
    .join('\n')

  const system =
    'Você categoriza transações financeiras. Responda APENAS com JSON válido.'
  const user =
    'Categorias disponíveis (id: nome (tipo)):\n' +
    catList +
    '\n\nTransações (indice: [tipo] descrição):\n' +
    txList +
    '\n\nPara cada transação, escolha a categoria mais adequada do MESMO tipo ' +
    '(saida=despesa, entrada=receita). Se nenhuma servir, use null. ' +
    'Formato exato: {"assignments":[{"index":0,"category_id":12}]}'

  try {
    const result = await chatJson<{
      assignments?: Array<{ index: number; category_id: number | null }>
    }>({ system, user, maxTokens: 2048 })

    const map: Record<number, number> = {}
    const validIds = new Set(userCategories.map((c) => c.id))
    for (const a of result?.assignments ?? []) {
      if (a && typeof a.index === 'number' && a.category_id && validIds.has(a.category_id)) {
        map[a.index] = a.category_id
      }
    }
    return map
  } catch {
    return {} // fallback silencioso para regras/sem categoria
  }
}
