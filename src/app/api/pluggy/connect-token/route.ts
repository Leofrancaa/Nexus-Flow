import { NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import db from '@/server/db/drizzle'
import { pluggyItems } from '@/server/db/schema'
import { getAuthUser, unauthorizedResponse } from '@/server/lib/auth'
import { apiError, err, ok } from '@/server/lib/apiResponse'
import {
  isPluggyConfigured,
  pluggyRequest,
  pluggySandboxEnabled,
  pluggyWebhookUrl,
} from '@/server/services/pluggyClient'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return unauthorizedResponse()
    if (!isPluggyConfigured()) return err('Integração bancária não configurada.', 503)

    const body = (await request.json().catch(() => ({}))) as { itemId?: string }
    if (body.itemId) {
      const [owned] = await db
        .select({ id: pluggyItems.id })
        .from(pluggyItems)
        .where(and(eq(pluggyItems.item_id, body.itemId), eq(pluggyItems.user_id, user.id)))
        .limit(1)
      if (!owned) return err('Conexão não encontrada.', 404)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
    const webhookUrl = pluggyWebhookUrl()
    const payload = {
      ...(body.itemId ? { itemId: body.itemId } : {}),
      options: {
        clientUserId: user.id,
        avoidDuplicates: true,
        ...(webhookUrl ? { webhookUrl } : {}),
        ...(appUrl?.startsWith('https://') ? { oauthRedirectUri: `${appUrl}/open-finance` } : {}),
      },
    }
    const token = await pluggyRequest<{ accessToken: string }>('/connect_token', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return ok({ accessToken: token.accessToken, includeSandbox: pluggySandboxEnabled() })
  } catch (error) {
    return apiError(error, 'Não foi possível iniciar a conexão bancária.')
  }
}
