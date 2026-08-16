import { describe, expect, it } from 'vitest'

import { db } from '../mocks/db'
import * as schema from '@/server/db/schema'
import { getCartoesAVencer } from '@/server/utils/finance/getCartoesAVencer'

const USER_ID = 1
const SERVICE_USER_ID = USER_ID as unknown as string

describe('fatura conciliada dinâmica', () => {
  it('mantém a base, acrescenta compra da mesma fatura e desconta crédito posterior', async () => {
    await db.insert(schema.pluggyItems).values({
      user_id: USER_ID,
      item_id: 'nubank-item',
      connector_name: 'Nubank',
    })
    const [card] = await db.insert(schema.cards).values({
      nome: 'platinum',
      tipo: 'crédito',
      numero: '6365',
      instituicao: 'Nubank',
      fatura_atual: '2207.25',
      sincronizado: true,
      user_id: USER_ID,
    }).returning()
    await db.insert(schema.pluggyAccounts).values({
      user_id: USER_ID,
      item_id: 'nubank-item',
      account_id: 'nubank-credit',
      type: 'CREDIT',
      card_id: card.id,
    })
    await db.insert(schema.expenses).values([
      {
        user_id: USER_ID,
        card_id: card.id,
        metodo_pagamento: 'Cartão de crédito',
        tipo: 'Compra já incluída no extrato',
        quantidade: '900',
        data: new Date('2026-08-16T12:00:00'),
        competencia_mes: 9,
        competencia_ano: 2026,
      },
      {
        user_id: USER_ID,
        card_id: card.id,
        metodo_pagamento: 'Cartão de crédito',
        tipo: 'Compra nova da fatura atual',
        quantidade: '100',
        data: new Date('2026-08-17T12:00:00'),
        competencia_mes: 9,
        competencia_ano: 2026,
      },
      {
        user_id: USER_ID,
        card_id: card.id,
        metodo_pagamento: 'Cartão de crédito',
        tipo: 'Compra da próxima fatura',
        quantidade: '500',
        data: new Date('2026-08-18T12:00:00'),
        competencia_mes: 10,
        competencia_ano: 2026,
      },
    ])
    await db.insert(schema.incomes).values({
      user_id: USER_ID,
      pluggy_account_id: 'nubank-credit',
      tipo: 'Estorno posterior',
      quantidade: '20',
      data: new Date('2026-08-19T12:00:00'),
    })

    const [result] = await getCartoesAVencer(
      SERVICE_USER_ID,
      new Date('2026-08-20T15:00:00Z')
    )

    expect(result.total_gasto).toBe(2450.05)
    expect(result.fatura_conciliada).toBe(true)
  })
})
