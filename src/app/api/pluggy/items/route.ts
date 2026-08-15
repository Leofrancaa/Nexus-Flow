import { NextRequest } from 'next/server'
import { and, desc, eq, ne, sql } from 'drizzle-orm'
import db from '@/server/db/drizzle'
import { pluggyAccounts, pluggyItems } from '@/server/db/schema'
import { getAuthUser, unauthorizedResponse } from '@/server/lib/auth'
import { apiError, err, ok } from '@/server/lib/apiResponse'
import { pluggyRequest } from '@/server/services/pluggyClient'
import { syncPluggyItem } from '@/server/services/pluggySyncService'

type RemoteItemSchedule = {
  status?: string
  nextAutoSyncAt?: string | null
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return unauthorizedResponse()

    const items = await db
      .select({
        id: pluggyItems.item_id,
        connectorId: pluggyItems.connector_id,
        connectorName: pluggyItems.connector_name,
        status: pluggyItems.status,
        lastSyncedAt: pluggyItems.last_synced_at,
        accountCount: sql<number>`count(${pluggyAccounts.id}) filter (where ${pluggyAccounts.type} in ('BANK', 'CREDIT'))::int`,
        balance: sql<string>`coalesce(sum(case when ${pluggyAccounts.type} in ('BANK', 'INVESTMENT') then ${pluggyAccounts.saldo} else 0 end), 0)`,
      })
      .from(pluggyItems)
      .leftJoin(pluggyAccounts, eq(pluggyAccounts.item_id, pluggyItems.item_id))
      .where(and(eq(pluggyItems.user_id, user.id), ne(pluggyItems.status, 'DELETED')))
      .groupBy(pluggyItems.id)
      .orderBy(desc(pluggyItems.created_at))
    // `nextAutoSyncAt` é a fonte oficial para saber se e quando a Pluggy fará
    // a próxima coleta. Consultas independentes seguem em paralelo para não
    // transformar três instituições em uma cascata de latência.
    const scheduledItems = await Promise.all(
      items.map(async (item) => {
        try {
          const remote = await pluggyRequest<RemoteItemSchedule>(
            `/items/${encodeURIComponent(item.id)}`
          )
          return {
            ...item,
            status: remote.status ?? item.status,
            nextAutoSyncAt: remote.nextAutoSyncAt ?? null,
            autoSyncActive: Boolean(remote.nextAutoSyncAt),
          }
        } catch {
          return { ...item, nextAutoSyncAt: null, autoSyncActive: false }
        }
      })
    )

    return ok(scheduledItems)
  } catch (error) {
    return apiError(error, 'Não foi possível carregar as conexões bancárias.')
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return unauthorizedResponse()
    const body = (await request.json().catch(() => ({}))) as { itemId?: string }
    if (!body.itemId) return err('itemId é obrigatório.', 400)
    return ok(await syncPluggyItem(body.itemId, user.id), 'Conta sincronizada com sucesso.')
  } catch (error) {
    return apiError(error, 'Não foi possível sincronizar a conta.')
  }
}
