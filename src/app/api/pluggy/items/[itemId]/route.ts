import { NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import db from '@/server/db/drizzle'
import { pluggyItems } from '@/server/db/schema'
import { getAuthUser, unauthorizedResponse } from '@/server/lib/auth'
import { apiError, err, ok } from '@/server/lib/apiResponse'
import { PluggyApiError, pluggyRequest } from '@/server/services/pluggyClient'
import { deletePluggyItemData } from '@/server/services/pluggySyncService'

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

    try {
      await pluggyRequest(`/items/${encodeURIComponent(itemId)}`, { method: 'DELETE' })
    } catch (error) {
      // A conexão pode ter sido apagada primeiro no Dashboard da Pluggy.
      // Nesse caso ainda precisamos limpar a cópia local do Nexus.
      if (!(error instanceof PluggyApiError) || ![404, 410].includes(error.status)) throw error
    }
    await deletePluggyItemData(itemId, user.id)
    return ok(null, 'Conexão removida e dados bancários apagados.')
  } catch (error) {
    return apiError(error, 'Não foi possível remover a conexão.')
  }
}
