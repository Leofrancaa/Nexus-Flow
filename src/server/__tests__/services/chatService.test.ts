import { describe, it, expect, vi, beforeEach } from 'vitest'
import { eq } from 'drizzle-orm'
import { db } from '../mocks/db'
import * as schema from '@/server/db/schema'
import { ChatService } from '@/server/services/chatService'
import { chatJson } from '@/server/services/llmService'

// IA mockada — sem rede, resposta determinística.
vi.mock('@/server/services/llmService', () => ({
  isLlmConfigured: () => true,
  chatText: vi.fn(async () => 'Seu maior gasto foi com Alimentação.'),
  chatJson: vi.fn(),
}))

const USER_ID = 1

beforeEach(async () => {
  // Algum dado financeiro para o construtor de contexto.
  await db.insert(schema.expenses).values([
    {
      metodo_pagamento: 'pix',
      tipo: 'Mercado',
      quantidade: '300',
      data: new Date(),
      user_id: USER_ID,
    },
    {
      metodo_pagamento: 'pix',
      tipo: 'Uber',
      quantidade: '50',
      data: new Date(),
      user_id: USER_ID,
    },
  ])
})

describe('ChatService.getStatus', () => {
  it('começa com o limite completo disponível', async () => {
    const status = await ChatService.getStatus(USER_ID)
    expect(status.limit).toBe(4)
    expect(status.used).toBe(0)
    expect(status.remaining).toBe(4)
  })
})

describe('ChatService.sendMessage', () => {
  it('responde, armazena as mensagens e decrementa o restante', async () => {
    const result = await ChatService.sendMessage(USER_ID, 'Qual meu maior gasto?')

    expect(result.reply).toContain('Alimentação')
    expect(result.status.used).toBe(1)
    expect(result.status.remaining).toBe(3)

    const stored = await ChatService.getHistory(USER_ID)
    expect(stored).toHaveLength(2) // user + assistant
    expect(stored[0].role).toBe('user')
    expect(stored[1].role).toBe('assistant')
  })

  it('bloqueia após atingir o limite diário de 4 mensagens', async () => {
    for (let i = 0; i < 4; i++) {
      await ChatService.sendMessage(USER_ID, `Pergunta ${i}`)
    }
    await expect(ChatService.sendMessage(USER_ID, 'Mais uma')).rejects.toMatchObject({
      status: 429,
    })
  })

  it('rejeita mensagem vazia', async () => {
    await expect(ChatService.sendMessage(USER_ID, '   ')).rejects.toMatchObject({ status: 400 })
  })

  it('rejeita mensagem muito longa', async () => {
    await expect(
      ChatService.sendMessage(USER_ID, 'a'.repeat(600))
    ).rejects.toMatchObject({ status: 400 })
  })
})

describe('ChatService.sendMessage — lançamentos via chat', () => {
  it('cria despesa quando a mensagem é um comando com valor', async () => {
    vi.mocked(chatJson).mockResolvedValueOnce({
      action: 'create_expense',
      descricao: 'Padaria',
      valor: 25.5,
      data: null,
      categoria: null,
      metodo: 'pix',
    })

    const result = await ChatService.sendMessage(USER_ID, 'gastei 25,50 na padaria')

    expect(result.reply).toContain('Despesa registrada')
    expect(result.reply).toContain('Padaria')

    const rows = await db.select().from(schema.expenses).where(eq(schema.expenses.tipo, 'Padaria'))
    expect(rows).toHaveLength(1)
    expect(Number(rows[0].quantidade)).toBe(25.5)
    expect(rows[0].metodo_pagamento).toBe('pix')
  })

  it('cria receita quando o comando é de recebimento', async () => {
    vi.mocked(chatJson).mockResolvedValueOnce({
      action: 'create_income',
      descricao: 'Freela',
      valor: 200,
      data: null,
      categoria: null,
      metodo: null,
    })

    const result = await ChatService.sendMessage(USER_ID, 'recebi 200 de um freela')

    expect(result.reply).toContain('Receita registrada')
    const rows = await db.select().from(schema.incomes).where(eq(schema.incomes.tipo, 'Freela'))
    expect(rows).toHaveLength(1)
    expect(Number(rows[0].quantidade)).toBe(200)
  })

  it('pede o valor quando o comando não o informa (e não cria nada)', async () => {
    vi.mocked(chatJson).mockResolvedValueOnce({
      action: 'create_expense',
      descricao: 'Farmácia',
      valor: null,
    })

    const result = await ChatService.sendMessage(USER_ID, 'adiciona uma despesa de farmácia')

    expect(result.reply.toLowerCase()).toContain('valor')
    const rows = await db.select().from(schema.expenses).where(eq(schema.expenses.tipo, 'Farmácia'))
    expect(rows).toHaveLength(0)
  })

  it('recusa lançamento no cartão de crédito e orienta usar o formulário', async () => {
    vi.mocked(chatJson).mockResolvedValueOnce({
      action: 'create_expense',
      descricao: 'Tênis',
      valor: 300,
      metodo: 'cartao de credito',
    })

    const result = await ChatService.sendMessage(USER_ID, 'comprei um tênis de 300 no crédito')

    expect(result.reply).toContain('cartão de crédito')
    const rows = await db.select().from(schema.expenses).where(eq(schema.expenses.tipo, 'Tênis'))
    expect(rows).toHaveLength(0)
  })

  it('cai no chat normal quando a classificação diz que não é comando', async () => {
    vi.mocked(chatJson).mockResolvedValueOnce({ action: 'none' })

    const result = await ChatService.sendMessage(USER_ID, 'quanto eu gastei este mês?')

    expect(result.reply).toContain('Alimentação')
  })
})

describe('ChatService.getHistory', () => {
  it('retorna o histórico em ordem cronológica', async () => {
    await ChatService.sendMessage(USER_ID, 'Primeira')
    await ChatService.sendMessage(USER_ID, 'Segunda')

    const history = await ChatService.getHistory(USER_ID)
    expect(history).toHaveLength(4)
    expect(history[0].content).toBe('Primeira')
    expect(history[2].content).toBe('Segunda')
  })
})
