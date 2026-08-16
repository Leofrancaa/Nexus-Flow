import { describe, expect, it } from 'vitest'

import { db } from '../mocks/db'
import * as schema from '@/server/db/schema'
import { ExpenseService } from '@/server/services/expenseService'
import { IncomeService } from '@/server/services/incomeService'
import { getSaldoAtual } from '@/server/utils/finance/getSaldoAtual'

const USER_ID = 1
const SERVICE_USER_ID = USER_ID as unknown as string

describe('marco inicial do acompanhamento financeiro', () => {
  it('recorta cada instituição sem apagar o histórico e inclui a fatura aberta do Mercado Pago', async () => {
    await db.insert(schema.pluggyItems).values([
      { user_id: USER_ID, item_id: 'mp-item', connector_name: 'Mercado Pago' },
      { user_id: USER_ID, item_id: 'nu-item', connector_name: 'Nubank' },
      { user_id: USER_ID, item_id: 'itau-item', connector_name: 'Itaú' },
    ])

    const [mpCard] = await db.insert(schema.cards).values({
      nome: 'Mercado Pago',
      tipo: 'crédito',
      numero: '1692',
      instituicao: 'Mercado Pago',
      user_id: USER_ID,
    }).returning()

    const [nubankCard] = await db.insert(schema.cards).values({
      nome: 'platinum',
      tipo: 'crédito',
      numero: '6365',
      instituicao: 'Nubank',
      user_id: USER_ID,
    }).returning()

    await db.insert(schema.pluggyAccounts).values([
      { user_id: USER_ID, item_id: 'mp-item', account_id: 'mp-bank', type: 'BANK' },
      { user_id: USER_ID, item_id: 'mp-item', account_id: 'mp-credit', type: 'CREDIT', card_id: mpCard.id },
      { user_id: USER_ID, item_id: 'nu-item', account_id: 'nu-bank', type: 'BANK' },
      { user_id: USER_ID, item_id: 'nu-item', account_id: 'nu-credit', type: 'CREDIT', card_id: nubankCard.id },
      { user_id: USER_ID, item_id: 'itau-item', account_id: 'itau-bank', type: 'BANK' },
    ])

    await db.insert(schema.expenses).values([
      {
        metodo_pagamento: 'débito', tipo: 'Manual preservada', quantidade: '5',
        data: new Date('2026-01-01T12:00:00'), user_id: USER_ID,
      },
      {
        metodo_pagamento: 'Conta bancária', tipo: 'MP antes', quantidade: '10',
        data: new Date('2026-08-11T12:00:00'), pluggy_account_id: 'mp-bank', origem: 'pluggy', user_id: USER_ID,
      },
      {
        metodo_pagamento: 'Conta bancária', tipo: 'MP no marco', quantidade: '20',
        data: new Date('2026-08-12T12:00:00'), pluggy_account_id: 'mp-bank', origem: 'pluggy', user_id: USER_ID,
      },
      {
        metodo_pagamento: 'Cartão de crédito', tipo: 'MP fatura antiga', quantidade: '15',
        data: new Date('2026-06-01T12:00:00'), competencia_mes: 8, competencia_ano: 2026,
        card_id: mpCard.id, pluggy_account_id: 'mp-credit', origem: 'pluggy', user_id: USER_ID,
      },
      {
        metodo_pagamento: 'Cartão de crédito', tipo: 'MP fatura setembro', quantidade: '30',
        data: new Date('2026-06-01T12:00:00'), competencia_mes: 9, competencia_ano: 2026,
        parcelas: 2, observacoes: 'Lançamento previsto de cartão · Sincronizado via Open Finance',
        card_id: mpCard.id, pluggy_account_id: 'mp-credit', origem: 'pluggy', user_id: USER_ID,
      },
      {
        metodo_pagamento: 'Conta bancária', tipo: 'Nu antes', quantidade: '40',
        data: new Date('2026-07-24T12:00:00'), pluggy_account_id: 'nu-bank', origem: 'pluggy', user_id: USER_ID,
      },
      {
        metodo_pagamento: 'Cartão de crédito', tipo: 'Nu parcela antiga', quantidade: '45',
        data: new Date('2026-06-24T12:00:00'), competencia_mes: 8, competencia_ano: 2026,
        card_id: nubankCard.id, pluggy_account_id: 'nu-credit', origem: 'pluggy', user_id: USER_ID,
      },
      {
        metodo_pagamento: 'Conta bancária', tipo: 'Nu no marco', quantidade: '50',
        data: new Date('2026-07-25T12:00:00'), pluggy_account_id: 'nu-bank', origem: 'pluggy', user_id: USER_ID,
      },
      {
        metodo_pagamento: 'Conta bancária', tipo: 'Itaú antes', quantidade: '60',
        data: new Date('2026-08-13T12:00:00'), pluggy_account_id: 'itau-bank', origem: 'pluggy', user_id: USER_ID,
      },
      {
        metodo_pagamento: 'Conta bancária', tipo: 'Itaú no marco', quantidade: '70',
        data: new Date('2026-08-14T12:00:00'), pluggy_account_id: 'itau-bank', origem: 'pluggy', user_id: USER_ID,
      },
    ])

    await db.insert(schema.incomes).values([
      {
        tipo: 'Manual preservada', quantidade: '100', data: new Date('2026-01-01T12:00:00'), user_id: USER_ID,
      },
      {
        tipo: 'MP antes', quantidade: '100', data: new Date('2026-08-11T12:00:00'),
        pluggy_account_id: 'mp-bank', origem: 'pluggy', user_id: USER_ID,
      },
      {
        tipo: 'MP no marco', quantidade: '200', data: new Date('2026-08-12T12:00:00'),
        pluggy_account_id: 'mp-bank', origem: 'pluggy', user_id: USER_ID,
      },
      {
        tipo: 'Nu antes', quantidade: '300', data: new Date('2026-07-24T12:00:00'),
        pluggy_account_id: 'nu-bank', origem: 'pluggy', user_id: USER_ID,
      },
      {
        tipo: 'Nu no marco', quantidade: '400', data: new Date('2026-07-25T12:00:00'),
        pluggy_account_id: 'nu-bank', origem: 'pluggy', user_id: USER_ID,
      },
      {
        tipo: 'Itaú antes', quantidade: '500', data: new Date('2026-08-13T12:00:00'),
        pluggy_account_id: 'itau-bank', origem: 'pluggy', user_id: USER_ID,
      },
      {
        tipo: 'Itaú no marco', quantidade: '600', data: new Date('2026-08-14T12:00:00'),
        pluggy_account_id: 'itau-bank', origem: 'pluggy', user_id: USER_ID,
      },
    ])

    const [visibleExpenses, visibleIncomes, septemberInvoice, balance] = await Promise.all([
      ExpenseService.getExpensesByDateRange(SERVICE_USER_ID, '2026-01-01', '2026-12-31'),
      IncomeService.getIncomesByDateRange(SERVICE_USER_ID, '2026-01-01', '2026-12-31'),
      ExpenseService.getExpensesByMonthYear(SERVICE_USER_ID, 9, 2026),
      getSaldoAtual(SERVICE_USER_ID),
    ])

    expect(visibleExpenses.map((row) => row.tipo).sort()).toEqual([
      'Itaú no marco',
      'MP fatura setembro',
      'MP no marco',
      'Manual preservada',
      'Nu no marco',
    ].sort())
    expect(visibleIncomes.map((row) => row.tipo).sort()).toEqual([
      'Itaú no marco',
      'MP no marco',
      'Manual preservada',
      'Nu no marco',
    ].sort())
    expect(septemberInvoice.map((row) => row.tipo)).toEqual(['MP fatura setembro'])
    expect(balance).toBe(1125)
  })
})
