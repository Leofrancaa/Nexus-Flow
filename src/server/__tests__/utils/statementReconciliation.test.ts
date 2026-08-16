import { describe, expect, it } from 'vitest'

import {
  calculateFinancialPosition,
  reconcileOpenInvoice,
} from '@/server/utils/finance/statementReconciliation'

describe('conciliação dos extratos de setembro/2026', () => {
  const referenceDate = new Date('2026-08-16T15:00:00Z')

  it('usa as faturas conferidas em vez dos totais incompletos da sincronização', () => {
    const nubank = reconcileOpenInvoice(
      { instituicao: 'Nubank', numero: '6365', total_gasto: 2207.25 },
      referenceDate
    )
    const mercadoPago = reconcileOpenInvoice(
      { instituicao: 'Mercado Pago', numero: '•••• 1692', total_gasto: 803.78 },
      referenceDate
    )

    expect(nubank).toMatchObject({ amount: 2370.05, reconciled: true })
    expect(mercadoPago).toMatchObject({ amount: 963.68, reconciled: true })
    expect(calculateFinancialPosition(1033.86, nubank.amount + mercadoPago.amount)).toBe(-2299.87)
  })

  it('volta ao valor sincronizado fora do ciclo conciliado', () => {
    expect(
      reconcileOpenInvoice(
        { instituicao: 'Nubank', numero: '6365', total_gasto: 411.129 },
        new Date('2026-10-01T15:00:00Z')
      )
    ).toEqual({ amount: 411.13, reconciled: false, reference: null })
  })

  it('soma compras novas e desconta créditos sem alterar a base conferida', () => {
    expect(
      reconcileOpenInvoice(
        {
          instituicao: 'Nubank',
          numero: '6365',
          total_gasto: 2207.25,
          expensesAfterStatement: 100,
          creditsAfterStatement: 30,
        },
        referenceDate
      ).amount
    ).toBe(2440.05)
  })
})
