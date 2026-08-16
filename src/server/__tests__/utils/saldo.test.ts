import { describe, it, expect } from 'vitest'
import { db } from '../mocks/db'
import * as schema from '@/server/db/schema'
import { getSaldoAtual } from '@/server/utils/finance/getSaldoAtual'
import { getSaldoFuturo } from '@/server/utils/finance/getSaldoFuturo'
import { getSaldoConectado } from '@/server/utils/finance/getSaldoConectado'

const USER_ID = 1

function diasAPartirDeHoje(dias: number): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + dias)
  return d
}

async function seedUser() {
  await db
    .insert(schema.profiles)
    .values({ id: USER_ID, nome: 'Teste', email: 'teste@nexus.dev' })
}

describe('saldo atual x saldo futuro', () => {
  it('a projeção inclui só o restante do mês, nunca todo o histórico futuro', async () => {
    await seedUser()

    await db.insert(schema.incomes).values([
      { user_id: USER_ID, tipo: 'Bônus', quantidade: '1000', data: new Date('2026-08-20') },
      { user_id: USER_ID, tipo: 'Bônus distante', quantidade: '5000', data: new Date('2026-09-20') },
    ])
    await db.insert(schema.expenses).values([
      {
        user_id: USER_ID,
        tipo: 'Notebook 2/3',
        metodo_pagamento: 'cartao de credito',
        quantidade: '700',
        data: new Date('2026-08-25'),
      },
    ])

    expect(await getSaldoFuturo(USER_ID, 3200, new Date('2026-08-15T12:00:00Z'))).toBe(3500)
  })

  it('lançamento de hoje conta no saldo atual', async () => {
    await seedUser()

    await db
      .insert(schema.incomes)
      .values({ user_id: USER_ID, tipo: 'Freelance', quantidade: '300', data: diasAPartirDeHoje(0) })

    expect(await getSaldoAtual(USER_ID)).toBe(300)
  })

  it('sem lançamento nenhum, os dois são zero', async () => {
    await seedUser()

    expect(await getSaldoAtual(USER_ID)).toBe(0)
    expect(await getSaldoFuturo(USER_ID)).toBe(0)
  })

  it('saldo conectado soma contas e cofrinhos, mas nunca dívida do cartão', async () => {
    await seedUser()
    await db.insert(schema.pluggyItems).values([
      { user_id: USER_ID, item_id: 'mercado-pago', connector_name: 'Mercado Pago' },
      { user_id: USER_ID, item_id: 'nubank', connector_name: 'Nubank' },
    ])
    await db.insert(schema.pluggyAccounts).values([
      {
        user_id: USER_ID,
        item_id: 'mercado-pago',
        account_id: 'bank-1',
        type: 'BANK',
        saldo: '2.64',
      },
      {
        user_id: USER_ID,
        item_id: 'mercado-pago',
        account_id: 'investment:pot-1',
        type: 'INVESTMENT',
        saldo: '1033',
      },
      {
        user_id: USER_ID,
        item_id: 'nubank',
        account_id: 'credit-1',
        type: 'CREDIT',
        saldo: '4594.26',
      },
    ])

    expect(await getSaldoConectado(USER_ID)).toEqual({
      total: 1035.64,
      investimentos: 1033,
      produtos: 2,
      mercadoPago: 1033,
      produtosMercadoPago: 2,
    })
  })
})
