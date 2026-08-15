import { NextRequest } from 'next/server'
import { getAuthUser, unauthorizedResponse } from '@/server/lib/auth'
import { apiError, ok } from '@/server/lib/apiResponse'
import { refreshPluggyItem } from '@/server/services/pluggySyncService'

export const maxDuration = 60

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) return unauthorizedResponse()
    const { itemId } = await context.params
    return ok(
      await refreshPluggyItem(itemId, user.id),
      'Atualização bancária solicitada com sucesso.'
    )
  } catch (error) {
    return apiError(error, 'Não foi possível sincronizar os dados bancários.')
  }
}
