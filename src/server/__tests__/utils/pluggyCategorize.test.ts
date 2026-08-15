import { describe, expect, it } from 'vitest'
import {
  categorizeByRules,
  type UserCategory,
} from '@/server/utils/pluggy/categorize'

const categories: UserCategory[] = [
  { id: 1, nome: 'Alimentação', tipo: 'despesa' },
  { id: 2, nome: 'Transporte', tipo: 'despesa' },
  { id: 3, nome: 'Educação', tipo: 'despesa' },
]

describe('categorização de transações Pluggy', () => {
  it.each([
    ['Senai*Matriculacima 2/2', 3],
    ['Blablacar 2/2', 2],
    ['Hiperideal 2/3', 1],
  ])('categoriza %s automaticamente', (description, expectedCategoryId) => {
    expect(categorizeByRules({ description, type: 'expense' }, categories)).toBe(
      expectedCategoryId
    )
  })

  it('deixa nomes desconhecidos para a categorização por IA em lote', () => {
    expect(
      categorizeByRules({ description: 'EMPRESA NOVA XYZ', type: 'expense' }, categories)
    ).toBeNull()
  })
})
