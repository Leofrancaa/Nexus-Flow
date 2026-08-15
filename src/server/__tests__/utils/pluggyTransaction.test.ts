import { describe, expect, it } from 'vitest'
import {
  transactionDateInBrazil,
  transactionDirection,
} from '@/server/utils/pluggy/transaction'

describe('normalização de transações Pluggy', () => {
  it('usa DEBIT/CREDIT em vez do sinal', () => {
    expect(transactionDirection({ type: 'DEBIT', amount: 95.99 }, 'CREDIT')).toBe('expense')
    expect(transactionDirection({ type: 'CREDIT', amount: -1500 }, 'CREDIT')).toBe('income')
    expect(transactionDirection({ type: 'CREDIT', amount: -1500 }, 'BANK')).toBe('income')
  })

  it('mantém compatibilidade com respostas antigas sem type', () => {
    expect(transactionDirection({ amount: 75 }, 'CREDIT')).toBe('expense')
    expect(transactionDirection({ amount: -75 }, 'BANK')).toBe('expense')
  })

  it('converte a data UTC para o dia civil de São Paulo', () => {
    expect(transactionDateInBrazil('2026-08-15T02:00:00.000Z').toISOString()).toBe(
      '2026-08-14T12:00:00.000Z'
    )
  })
})
