import { describe, expect, it } from 'vitest'
import { findMerchantBrand } from '@/lib/merchantBrands'

describe('biblioteca de marcas dos lançamentos', () => {
  it.each([
    ['IFD*ZKB COMERCIO DE AL', 'ifood'],
    ['MERCADOLIVRE*MERCADOLIVRE', 'mercado-livre'],
    ['PayU*ADIDAS', 'adidas'],
    ['Vindi *Ddnaguideliver', 'delivery'],
    ['DL*GOOGLE ChatGP', 'chatgpt'],
    ['Claude.ai', 'claude'],
    ['AMAZONMKTPLC*EMMASLEEP', 'amazon'],
    ['Cacau Show', 'cacau-show'],
    ['Senai*Matriculacima', 'senai'],
  ])('reconhece %s como %s', (description, expectedBrand) => {
    expect(findMerchantBrand(description)?.id).toBe(expectedBrand)
  })
})
