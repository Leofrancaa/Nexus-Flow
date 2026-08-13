import { NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import db from '@/server/db/drizzle'
import { expenses, incomes, pluggyAccounts, pluggyItems } from '@/server/db/schema'
import { getAuthUser, unauthorizedResponse } from '@/server/lib/auth'
import { apiError, err, ok } from '@/server/lib/apiResponse'
import { pluggyRequest } from '@/server/services/pluggyClient'

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) return unauthorizedResponse()
    const { itemId } = await context.params
    const [owned] = await db
      .select({ id: pluggyItems.id })
      .from(pluggyItems)
      .where(and(eq(pluggyItems.item_id, itemId), eq(pluggyItems.user_id, user.id)))
      .limit(1)
    if (!owned) return err('Conexão não encontrada.', 404)

    await pluggyRequest(`/items/${encodeURIComponent(itemId)}`, { method: 'DELETE' })
    await db.transaction(async (tx) => {
      const accountIds = await tx
        .select({ id: pluggyAccounts.account_id })
        .from(pluggyAccounts)
        .where(and(eq(pluggyAccounts.item_id, itemId), eq(pluggyAccounts.user_id, user.id)))
      const ids = accountIds.map((account) => account.id)
      if (ids.length) {
        for (const id of ids) {
          await tx.delete(expenses).where(and(eq(expenses.pluggy_account_id, id), eq(expenses.user_id, user.id)))
          await tx.delete(incomes).where(and(eq(incomes.pluggy_account_id, id), eq(incomes.user_id, user.id)))
        }
      }
      await tx.delete(pluggyAccounts).where(and(eq(pluggyAccounts.item_id, itemId), eq(pluggyAccounts.user_id, user.id)))
      await tx.delete(pluggyItems).where(and(eq(pluggyItems.item_id, itemId), eq(pluggyItems.user_id, user.id)))
    })
    return ok(null, 'Conexão removida e dados bancários apagados.')
  } catch (error) {
    return apiError(error, 'Não foi possível remover a conexão.')
  }
}
