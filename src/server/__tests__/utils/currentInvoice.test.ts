import { describe, expect, it } from 'vitest'

import { calculateCurrentInvoice } from '@/server/utils/pluggy/currentInvoice'

describe('calculateCurrentInvoice', () => {
  const now = new Date('2026-08-15T12:00:00Z')

  it('prefere a fatura bancária com vencimento atual ao limite usado', () => {
    const result = calculateCurrentInvoice({
      now,
      dueDate: '2026-08-03',
      closeDate: '2026-07-25',
      transactions: [],
      bills: [
        { totalAmount: 800, dueDate: '2026-08-03', billClosingDate: '2026-07-25' },
        { totalAmount: 1234.56, dueDate: '2026-09-03', billClosingDate: '2026-08-25' },
      ],
    })

    expect(result.amount).toBe(1234.56)
    expect(result.source).toBe('bill')
    expect(result.dueDate?.toISOString().slice(0, 10)).toBe('2026-09-03')
  })

  it('soma somente lançamentos previstos para a fatura em aberto', () => {
    const result = calculateCurrentInvoice({
      now,
      dueDate: '2026-08-03',
      closeDate: '2026-07-25',
      transactions: [
        {
          amount: 100,
          date: '2026-08-10',
          status: 'PENDING',
          creditCardMetadata: { billForecastDate: '2026-09' },
        },
        {
          amount: 50,
          date: '2026-08-12',
          status: 'PENDING',
          creditCardMetadata: { billForecastDate: '2026-09' },
        },
        {
          amount: 400,
          date: '2026-09-10',
          status: 'PENDING',
          creditCardMetadata: { billForecastDate: '2026-10' },
        },
      ],
    })

    expect(result.amount).toBe(150)
    expect(result.source).toBe('transactions')
    expect(result.closeDate?.toISOString().slice(0, 10)).toBe('2026-08-25')
  })

  it('usa as datas do ciclo quando a instituição omite a competência prevista', () => {
    const result = calculateCurrentInvoice({
      now,
      dueDate: '2026-08-03',
      closeDate: '2026-07-25',
      transactions: [
        { amount: 90, date: '2026-07-28', status: 'PENDING' },
        { amount: 10, date: '2026-08-14', status: 'POSTED' },
        {
          amount: 999,
          date: '2026-07-20',
          status: 'POSTED',
          creditCardMetadata: { billId: 'previous-bill' },
        },
      ],
    })

    expect(result.amount).toBe(100)
    expect(result.source).toBe('transactions')
  })

  it('não inventa fatura quando faltam ciclo e entidade Bill', () => {
    expect(
      calculateCurrentInvoice({ now, transactions: [], bills: [] })
    ).toEqual({ amount: 0, dueDate: null, closeDate: null, source: 'unavailable' })
  })
})
