import { describe, it, expect } from 'vitest'
import { db } from '../mocks/db'
import * as schema from '@/server/db/schema'
import { getSaldoAtual } from '@/server/utils/finance/getSaldoAtual'
import { getSaldoFuturo } from '@/server/utils/finance/getSaldoFuturo'

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

/**
 * Os dois saldos já foram byte-idênticos: ambos somavam tudo, sem recorte de
 * data, e o dashboard mostrava dois números que nunca podiam divergir. Este
 * arquivo existe para travar a diferença entre eles.
 */
describe('saldo atual x saldo futuro', () => {
  it('o saldo atual ignora lançamento datado para a frente; o futuro o inclui', async () => {
    await seedUser()

    await db.insert(schema.incomes).values([
      { user_id: USER_ID, tipo: 'Salário', quantidade: '5000', data: diasAPartirDeHoje(-5) },
      { user_id: USER_ID, tipo: 'Bônus', quantidade: '1000', data: diasAPartirDeHoje(20) },
    ])
    await db.insert(schema.expenses).values([
      {
        user_id: USER_ID,
        tipo: 'Aluguel',
        metodo_pagamento: 'pix',
        quantidade: '1800',
        data: diasAPartirDeHoje(-3),
      },
      {
        // Parcela que o app já gravou com data futura.
        user_id: USER_ID,
        tipo: 'Notebook 2/3',
        metodo_pagamento: 'cartao de credito',
        quantidade: '700',
        data: diasAPartirDeHoje(30),
      },
    ])

    expect(await getSaldoAtual(USER_ID)).toBe(5000 - 1800)
    expect(await getSaldoFuturo(USER_ID)).toBe(5000 + 1000 - 1800 - 700)
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
})
