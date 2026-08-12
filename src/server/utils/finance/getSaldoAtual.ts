import { and, eq, lte, sum } from 'drizzle-orm'
import db from '@/server/db/drizzle'
import { incomes, expenses } from '@/server/db/schema'

/**
 * Saldo do que já aconteceu: soma tudo com data até hoje.
 *
 * O par com `getSaldoFuturo` só faz sentido por causa deste recorte — lá
 * entram também as linhas datadas para a frente, como as parcelas que o app
 * já gravou. Sem o filtro, os dois números eram sempre idênticos e o
 * "saldo futuro" do dashboard não queria dizer nada.
 */
export const getSaldoAtual = async (user_id: number): Promise<number> => {
    const hoje = new Date()

    const [receitas, despesas] = await Promise.all([
        db
            .select({ total: sum(incomes.quantidade) })
            .from(incomes)
            .where(and(eq(incomes.user_id, user_id), lte(incomes.data, hoje))),
        db
            .select({ total: sum(expenses.quantidade) })
            .from(expenses)
            .where(and(eq(expenses.user_id, user_id), lte(expenses.data, hoje))),
    ])

    return Number(receitas[0]?.total ?? 0) - Number(despesas[0]?.total ?? 0)
}
