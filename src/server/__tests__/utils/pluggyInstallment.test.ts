import { describe, expect, it } from 'vitest'
import {
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
})
