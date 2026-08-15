import { NextRequest } from 'next/server'
import { getAuthUser, unauthorizedResponse } from '@/server/lib/auth'
import { apiError, ok } from '@/server/lib/apiResponse'
import { ensureDefaultCategories } from '@/server/services/defaultCategoryService'
import { syncStalePluggyItems } from '@/server/services/pluggySyncService'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return unauthorizedResponse()

    await ensureDefaultCategories(user.id)
    const items = await syncStalePluggyItems(user.id)
    const failed = items.filter((item) => item.status === 'ERROR')
    return ok(
      { synchronized: items.length - failed.length, failed: failed.length },
      'Dados do Open Finance verificados.'
    )
  } catch (error) {
    return apiError(error, 'Não foi possível atualizar os dados bancários.')
  }
}
