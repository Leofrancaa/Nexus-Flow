import { describe, expect, it } from 'vitest'
import {
  categorizeByRules,
  type UserCategory,
} from '@/server/utils/pluggy/categorize'

const categories: UserCategory[] = [
  { id: 1, nome: 'Alimentação', tipo: 'despesa' },
  { id: 2, nome: 'Transporte', tipo: 'despesa' },
  { id: 3, nome: 'Educação', tipo: 'despesa' },
  { id: 4, nome: 'Compras', tipo: 'despesa' },
  { id: 5, nome: 'Assinaturas', tipo: 'despesa' },
]

describe('categorização de transações Pluggy', () => {
  it.each([
    ['Senai*Matriculacima 2/2', 3],
    ['Blablacar 2/2', 2],
    ['Hiperideal 2/3', 1],
    ['IFD*ZKB COMERCIO DE AL', 1],
    ['Vindi *Ddnaguideliver', 1],
    ['Cacau Show', 1],
    ['MERCADOLIVRE*MERCADOLIVRE', 4],
    ['PayU*ADIDAS', 4],
    ['DL*GOOGLE ChatGP', 5],
    ['Claude.ai Subscription', 5],
  ])('categoriza %s automaticamente', (description, expectedCategoryId) => {
    expect(categorizeByRules({ description, type: 'expense' }, categories)).toBe(
      expectedCategoryId
    )
  })

  it('prioriza o comerciante sobre uma categoria genérica incorreta do provedor', () => {
    expect(
      categorizeByRules(
        {
          description: 'AMAZONMKTPLC*EMMASLEEP',
          providerCategory: 'Houseware',
          type: 'expense',
        },
        categories
      )
    ).toBe(4)
  })

  it('deixa nomes desconhecidos para a categorização por IA em lote', () => {
    expect(
      categorizeByRules({ description: 'EMPRESA NOVA XYZ', type: 'expense' }, categories)
    ).toBeNull()
  })
})
