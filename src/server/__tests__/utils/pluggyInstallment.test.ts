import { describe, expect, it } from 'vitest'
import {
  cardTransactionDates,
  installmentAccountingDate,
  installmentDescription,
} from '@/server/utils/pluggy/installment'

describe('parcelas de cartão Pluggy', () => {
  it('inclui o número da parcela sem duplicar um sufixo já existente', () => {
    expect(
      installmentDescription('MERCADOLIVRE*MERCADOLIVRE', {
        installmentNumber: 3,
        totalInstallments: 12,
      })
    ).toBe('MERCADOLIVRE*MERCADOLIVRE 3/12')

    expect(
      installmentDescription('Hiperideal 2/3', {
        installmentNumber: 2,
        totalInstallments: 3,
      })
    ).toBe('Hiperideal 2/3')
  })

  it('usa o mês previsto da fatura como competência', () => {
    const purchaseDate = new Date('2026-08-31T12:00:00.000Z')
    expect(
      installmentAccountingDate(purchaseDate, {
        installmentNumber: 2,
        totalInstallments: 12,
        billForecastDate: '2026-09-15T00:00:00.000Z',
      }).toISOString()
    ).toBe('2026-09-30T12:00:00.000Z')
  })

  it('mantém a data da transação quando a previsão não existe', () => {
    const purchaseDate = new Date('2026-08-12T12:00:00.000Z')
    expect(installmentAccountingDate(purchaseDate)).toBe(purchaseDate)
  })

  it('prefere a fatura vinculada quando a previsão já foi removida', () => {
    const providerDate = new Date('2026-01-12T12:00:00.000Z')
    expect(
      installmentAccountingDate(
        providerDate,
        { installmentNumber: 8, totalInstallments: 12 },
        '2026-08-17'
      ).toISOString()
    ).toBe('2026-08-12T12:00:00.000Z')
  })

  it('não troca a data real de uma transação já efetivada pela data da fatura', () => {
    const purchaseDate = new Date('2026-07-30T12:00:00.000Z')
    const dates = cardTransactionDates(purchaseDate, 'POSTED', {
      installmentNumber: 2,
      totalInstallments: 12,
      billForecastDate: '2026-08-30',
    })

    expect(dates.activityDate.toISOString()).toBe('2026-07-30T12:00:00.000Z')
    expect(dates.competenceDate.toISOString()).toBe('2026-08-30T12:00:00.000Z')
    expect(dates.pending).toBe(false)
  })

  it('mantém uma previsão PENDING separada dos gastos realizados', () => {
    const purchaseDate = new Date('2026-07-29T12:00:00.000Z')
    const dates = cardTransactionDates(purchaseDate, 'PENDING', {
      installmentNumber: 3,
      totalInstallments: 12,
      billForecastDate: '2026-09-29',
    })

    expect(dates.activityDate.toISOString()).toBe('2026-07-29T12:00:00.000Z')
    expect(dates.competenceDate.toISOString()).toBe('2026-09-29T12:00:00.000Z')
    expect(dates.pending).toBe(true)
  })
})
