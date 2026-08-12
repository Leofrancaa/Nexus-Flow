import { eq, sum } from 'drizzle-orm'
import db from '@/server/db/drizzle'
import { incomes, expenses } from '@/server/db/schema'

/**
 * Saldo projetado: soma tudo, sem recorte de data.
 *
 * Inclui o que ainda vai acontecer e já está lançado — parcela futura de
 * compra no cartão, receita fixa replicada. É o número que responde "se nada
 * mudar, onde eu termino"; o de hoje está em `getSaldoAtual`.
 */
export const getSaldoFuturo = async (user_id: number): Promise<number> => {
    const [receitas, despesas] = await Promise.all([
        db.select({ total: sum(incomes.quantidade) }).from(incomes).where(eq(incomes.user_id, user_id)),
        db.select({ total: sum(expenses.quantidade) }).from(expenses).where(eq(expenses.user_id, user_id)),
    ])

    return Number(receitas[0]?.total ?? 0) - Number(despesas[0]?.total ?? 0)
}
