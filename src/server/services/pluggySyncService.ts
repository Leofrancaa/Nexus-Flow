import { and, eq, inArray, sql } from 'drizzle-orm'
import type { Account, Item } from 'pluggy-js'
import db from '@/server/db/drizzle'
import {
  categories,
  expenses,
  incomes,
  pluggyAccounts,
  pluggyItems,
  pluggyWebhookEvents,
} from '@/server/db/schema'
import { categorizeByRules } from '@/server/utils/pluggy/categorize'
import { PluggyApiError, pluggyRequest } from '@/server/services/pluggyClient'

type PluggyTransaction = {
  id: string
  accountId: string
  date: string
  description: string
  amount: number
  currencyCode?: string
  creditCardMetadata?: { totalInstallments?: number | null } | null
}

type CursorResponse<T> = { results: T[]; next?: string | null }

function nextCursor(next: string | null | undefined): string | null {
  if (!next) return null
  try {
    const url = new URL(next, 'https://api.pluggy.ai')
    return url.searchParams.get('after')
  } catch {
    return null
  }
}

async function listTransactions(accountId: string): Promise<PluggyTransaction[]> {
  const all: PluggyTransaction[] = []
  let after: string | null = null
  do {
    const query = new URLSearchParams({ accountId })
    if (after) query.set('after', after)
    const page = await pluggyRequest<CursorResponse<PluggyTransaction>>(
      `/v2/transactions?${query.toString()}`
    )
    all.push(...page.results)
    after = nextCursor(page.next)
  } while (after)
  return all
}

async function resolveOwner(item: Item, expectedUserId?: string): Promise<string> {
  if (expectedUserId) {
    if (item.clientUserId !== expectedUserId) {
      throw new PluggyApiError('Esta conexão bancária não pertence ao usuário.', 403)
    }
    return expectedUserId
  }

  if (item.clientUserId) return item.clientUserId
  const [stored] = await db
    .select({ userId: pluggyItems.user_id })
    .from(pluggyItems)
    .where(eq(pluggyItems.item_id, item.id))
    .limit(1)
  if (!stored) throw new PluggyApiError('Não foi possível identificar o dono da conexão.', 404)
  return stored.userId
}

export async function syncPluggyItem(itemId: string, expectedUserId?: string) {
  const item = await pluggyRequest<Item>(`/items/${encodeURIComponent(itemId)}`)
  const userId = await resolveOwner(item, expectedUserId)

  await db
    .insert(pluggyItems)
    .values({
      user_id: userId,
      item_id: item.id,
      connector_id: item.connector?.id,
      connector_name: item.connector?.name,
      status: item.status,
      last_synced_at: item.lastUpdatedAt ? new Date(item.lastUpdatedAt) : null,
    })
    .onConflictDoUpdate({
      target: pluggyItems.item_id,
      set: {
        connector_id: item.connector?.id,
        connector_name: item.connector?.name,
        status: item.status,
        last_synced_at: item.lastUpdatedAt ? new Date(item.lastUpdatedAt) : null,
        updated_at: new Date(),
      },
    })

  if (item.status !== 'UPDATED') {
    return { itemId: item.id, status: item.status, accounts: 0, transactions: 0 }
  }

  const accountResponse = await pluggyRequest<{ results: Account[] }>(
    `/accounts?itemId=${encodeURIComponent(item.id)}`
  )
  const accountRows = accountResponse.results

  for (const account of accountRows) {
    await db
      .insert(pluggyAccounts)
      .values({
        user_id: userId,
        item_id: item.id,
        account_id: account.id,
        type: account.type,
        subtype: account.subtype,
        nome: account.marketingName || account.name,
        numero: account.number,
        saldo: String(account.balance ?? 0),
      })
      .onConflictDoUpdate({
        target: pluggyAccounts.account_id,
        set: {
          type: account.type,
          subtype: account.subtype,
          nome: account.marketingName || account.name,
          numero: account.number,
          saldo: String(account.balance ?? 0),
          updated_at: new Date(),
        },
      })
  }

  const userCategories = await db
    .select({ id: categories.id, nome: categories.nome, tipo: categories.tipo })
    .from(categories)
    .where(eq(categories.user_id, userId))

  let transactionCount = 0
  for (const account of accountRows) {
    const transactions = await listTransactions(account.id)
    transactionCount += transactions.length

    for (const transaction of transactions) {
      if (!transaction.amount) continue
      const isExpense = transaction.amount < 0
      const categoryId = categorizeByRules(
        { description: transaction.description, type: isExpense ? 'expense' : 'income' },
        userCategories
      )
      const transactionDate = new Date(transaction.date)

      if (isExpense) {
        await db.delete(incomes).where(eq(incomes.pluggy_transaction_id, transaction.id))
        await db
          .insert(expenses)
          .values({
            user_id: userId,
            pluggy_transaction_id: transaction.id,
            pluggy_account_id: account.id,
            origem: 'pluggy',
            metodo_pagamento: account.type === 'CREDIT' ? 'Cartão de crédito' : 'Conta bancária',
            tipo: transaction.description,
            quantidade: Math.abs(transaction.amount).toFixed(2),
            data: transactionDate,
            parcelas: transaction.creditCardMetadata?.totalInstallments ?? null,
            category_id: categoryId,
            observacoes: 'Sincronizado via Open Finance',
          })
          .onConflictDoUpdate({
            target: expenses.pluggy_transaction_id,
            targetWhere: sql`${expenses.pluggy_transaction_id} IS NOT NULL`,
            set: {
              pluggy_account_id: account.id,
              metodo_pagamento: account.type === 'CREDIT' ? 'Cartão de crédito' : 'Conta bancária',
              tipo: transaction.description,
              quantidade: Math.abs(transaction.amount).toFixed(2),
              data: transactionDate,
              parcelas: transaction.creditCardMetadata?.totalInstallments ?? null,
              category_id: sql`case when ${expenses.categoria_manual} then ${expenses.category_id} else ${categoryId} end`,
              updated_at: new Date(),
            },
          })
      } else {
        await db.delete(expenses).where(eq(expenses.pluggy_transaction_id, transaction.id))
        await db
          .insert(incomes)
          .values({
            user_id: userId,
            pluggy_transaction_id: transaction.id,
            pluggy_account_id: account.id,
            origem: 'pluggy',
            tipo: transaction.description,
            quantidade: transaction.amount.toFixed(2),
            data: transactionDate,
            fonte: account.marketingName || account.name || 'Open Finance',
            nota: 'Sincronizado via Open Finance',
            category_id: categoryId,
          })
          .onConflictDoUpdate({
            target: incomes.pluggy_transaction_id,
            targetWhere: sql`${incomes.pluggy_transaction_id} IS NOT NULL`,
            set: {
              pluggy_account_id: account.id,
              tipo: transaction.description,
              quantidade: transaction.amount.toFixed(2),
              data: transactionDate,
              fonte: account.marketingName || account.name || 'Open Finance',
              category_id: sql`case when ${incomes.categoria_manual} then ${incomes.category_id} else ${categoryId} end`,
              updated_at: new Date(),
            },
          })
      }
    }
  }

  await db
    .update(pluggyItems)
    .set({ status: item.status, last_synced_at: new Date(), updated_at: new Date() })
    .where(and(eq(pluggyItems.item_id, item.id), eq(pluggyItems.user_id, userId)))

  return { itemId: item.id, status: item.status, accounts: accountRows.length, transactions: transactionCount }
}

export async function deletePluggyTransactions(ids: string[]) {
  if (!ids.length) return
  await Promise.all([
    db.delete(expenses).where(inArray(expenses.pluggy_transaction_id, ids)),
    db.delete(incomes).where(inArray(incomes.pluggy_transaction_id, ids)),
  ])
}

export async function markWebhookProcessed(eventId: string, error?: unknown) {
  await db
    .update(pluggyWebhookEvents)
    .set({
      status: error ? 'failed' : 'processed',
      error: error ? String(error instanceof Error ? error.message : error).slice(0, 1000) : null,
      processed_at: new Date(),
    })
    .where(eq(pluggyWebhookEvents.event_id, eventId))
}
