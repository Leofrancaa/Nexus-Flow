import { after } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { eq } from 'drizzle-orm'
import db from '@/server/db/drizzle'
import { pluggyItems, pluggyWebhookEvents } from '@/server/db/schema'
import {
  deletePluggyItemData,
  deletePluggyTransactions,
  markWebhookProcessed,
  syncPluggyItem,
} from '@/server/services/pluggySyncService'

type PluggyWebhook = {
  event?: string
  eventId?: string
  itemId?: string
  clientUserId?: string
  transactionIds?: string[]
  error?: { code?: string; message?: string }
}

function validSecret(received: string | null): boolean {
  const expected = process.env.PLUGGY_WEBHOOK_SECRET
  if (!expected || !received) return false
  const a = Buffer.from(received)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

async function processWebhook(payload: PluggyWebhook) {
  try {
    if (payload.event === 'item/deleted' && payload.itemId) {
      await deletePluggyItemData(payload.itemId)
    } else if (payload.event === 'transactions/deleted') {
      await deletePluggyTransactions(payload.transactionIds ?? [])
    } else if (payload.itemId && ['item/created', 'item/updated', 'transactions/created', 'transactions/updated'].includes(payload.event ?? '')) {
      await syncPluggyItem(payload.itemId, payload.clientUserId)
    } else if (payload.itemId && payload.event?.startsWith('item/')) {
      const status = payload.event === 'item/error' ? 'LOGIN_ERROR' : payload.event.replace('item/', '').toUpperCase()
      await db.update(pluggyItems).set({ status, updated_at: new Date() }).where(eq(pluggyItems.item_id, payload.itemId))
    }
    await markWebhookProcessed(payload.eventId!)
  } catch (error) {
    console.error('[pluggy-webhook]', payload.eventId, error)
    await markWebhookProcessed(payload.eventId!, error)
  }
}

export async function POST(request: Request) {
  if (!validSecret(request.headers.get('x-nexus-webhook-secret'))) {
    return Response.json({ ok: false }, { status: 401 })
  }

  const payload = (await request.json().catch(() => null)) as PluggyWebhook | null
  if (!payload?.event || !payload.eventId) {
    return Response.json({ ok: false, error: 'Payload inválido.' }, { status: 400 })
  }

  const inserted = await db
    .insert(pluggyWebhookEvents)
    .values({ event_id: payload.eventId, event: payload.event, item_id: payload.itemId })
    .onConflictDoNothing({ target: pluggyWebhookEvents.event_id })
    .returning({ id: pluggyWebhookEvents.id })

  if (inserted.length) after(() => processWebhook(payload))
  return Response.json({ ok: true, duplicate: inserted.length === 0 }, { status: 202 })
}
