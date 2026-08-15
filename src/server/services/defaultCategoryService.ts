import { eq } from 'drizzle-orm'
import db from '@/server/db/drizzle'
import { categories } from '@/server/db/schema'

type DefaultCategory = {
  nome: string
  cor: string
  tipo: 'despesa' | 'receita'
}

const EXPENSE_CATEGORIES: DefaultCategory[] = [
  { nome: 'Alimentação', cor: '#d4ff00', tipo: 'despesa' },
  { nome: 'Moradia', cor: '#38bdf8', tipo: 'despesa' },
  { nome: 'Transporte', cor: '#fb923c', tipo: 'despesa' },
  { nome: 'Saúde', cor: '#a78bfa', tipo: 'despesa' },
  { nome: 'Lazer', cor: '#f472b6', tipo: 'despesa' },
  { nome: 'Educação', cor: '#60a5fa', tipo: 'despesa' },
  { nome: 'Compras', cor: '#f59e0b', tipo: 'despesa' },
  { nome: 'Serviços', cor: '#2dd4bf', tipo: 'despesa' },
  { nome: 'Assinaturas', cor: '#8b5cf6', tipo: 'despesa' },
  { nome: 'Viagens', cor: '#06b6d4', tipo: 'despesa' },
  { nome: 'Impostos', cor: '#ef4444', tipo: 'despesa' },
  { nome: 'Taxas bancárias', cor: '#94a3b8', tipo: 'despesa' },
  { nome: 'Seguros', cor: '#14b8a6', tipo: 'despesa' },
  { nome: 'Transferências', cor: '#64748b', tipo: 'despesa' },
  { nome: 'Outros', cor: '#71717a', tipo: 'despesa' },
]

const INCOME_CATEGORIES: DefaultCategory[] = [
  { nome: 'Salário', cor: '#a3e635', tipo: 'receita' },
  { nome: 'Freelance', cor: '#38bdf8', tipo: 'receita' },
  { nome: 'Rendimentos', cor: '#fbbf24', tipo: 'receita' },
  { nome: 'Reembolsos', cor: '#34d399', tipo: 'receita' },
  { nome: 'Transferências', cor: '#818cf8', tipo: 'receita' },
  { nome: 'Outros rendimentos', cor: '#a1a1aa', tipo: 'receita' },
]

/**
 * Cria o conjunto inicial apenas quando o usuário ainda não tem nenhuma
 * categoria daquele tipo. Assim uma categoria apagada de propósito não volta
 * a cada acesso, mas contas antigas sem o seed são reparadas automaticamente.
 */
export async function ensureDefaultCategories(userId: string): Promise<void> {
  const existing = await db
    .select({ tipo: categories.tipo })
    .from(categories)
    .where(eq(categories.user_id, userId))

  const hasExpenses = existing.some((category) => category.tipo === 'despesa')
  const hasIncomes = existing.some((category) => category.tipo === 'receita')
  const missing = [
    ...(hasExpenses ? [] : EXPENSE_CATEGORIES),
    ...(hasIncomes ? [] : INCOME_CATEGORIES),
  ]

  if (missing.length > 0) {
    await db.insert(categories).values(
      missing.map((category) => ({ ...category, user_id: userId }))
    )
  }
}
