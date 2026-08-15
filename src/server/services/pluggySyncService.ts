import { and, eq, inArray, sql } from 'drizzle-orm'
import type { Account, Investment, Item } from 'pluggy-js'
import db from '@/server/db/drizzle'
import {
  categories,
  cards,
  expenses,
  incomes,
  pluggyAccounts,
  pluggyItems,
  pluggyWebhookEvents,
} from '@/server/db/schema'
import { categorizeByRules, categorizeWithLlm } from '@/server/utils/pluggy/categorize'
import { ensureDefaultCategories } from '@/server/services/defaultCategoryService'
import { PluggyApiError, pluggyRequest } from '@/server/services/pluggyClient'
import {
  transactionDateInBrazil,
  transactionDirection,
} from '@/server/utils/pluggy/transaction'
import {
  calculateCurrentInvoice,
  type PluggyCardBill,
} from '@/server/utils/pluggy/currentInvoice'

type PluggyTransaction = {
  id: string
  accountId: string
  date: string
  description: string
  amount: number
  status?: string | null
  type?: 'DEBIT' | 'CREDIT' | string | null
  category?: string | null
  operationType?: string | null
  merchant?: { name?: string | null; businessName?: string | null } | null
  currencyCode?: string
  creditCardMetadata?: {
    totalInstallments?: number | null
    installmentNumber?: number | null
    billId?: string | null
    billForecastDate?: string | null
  } | null
}

type CursorResponse<T> = { results: T[]; next?: string | null }
type SyncedInvestment = {
  id: string
  type: string
  name: string
  number: string | null
  balance: number
}
const WRITE_BATCH_SIZE = 250
const AI_CATEGORY_BATCH_SIZE = 20
const UPDATE_POLL_INTERVAL_MS = 2_000
const UPDATE_POLL_TIMEOUT_MS = 20_000

const INSTITUTION_COLORS: Record<string, string> = {
  nubank: '#820ad1',
  'mercado pago': '#009ee3',
  itau: '#ec7000',
}

function normalized(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function institutionColor(name: string | null | undefined) {
  const key = normalized(name ?? '')
  return Object.entries(INSTITUTION_COLORS).find(([term]) => key.includes(term))?.[1] ?? '#52525b'
}

function safeDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null
  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function daysBetween(later: Date | null, earlier: Date | null) {
  if (!later || !earlier) return 10
  const days = Math.round((later.getTime() - earlier.getTime()) / 86_400_000)
  return days >= 1 && days <= 31 ? days : 10
}

function batches<T>(items: T[], size = WRITE_BATCH_SIZE): T[][] {
  const result: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size))
  }
  return result
}

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

async function optionalPluggyList<T>(path: string): Promise<T[]> {
  try {
    const response = await pluggyRequest<{ results: T[] }>(path)
    return response.results ?? []
  } catch (error) {
    // Nem todo conector oferece faturas/investimentos. Ausência de produto ou
    // de consentimento não pode impedir contas e transações de sincronizarem.
    if (error instanceof PluggyApiError && [400, 403, 404, 422].includes(error.status)) return []
    throw error
  }
}

function listBills(accountId: string): Promise<PluggyCardBill[]> {
  return optionalPluggyList<PluggyCardBill>(
    `/bills?accountId=${encodeURIComponent(accountId)}`
  )
}

function listInvestments(itemId: string): Promise<Investment[]> {
  return optionalPluggyList<Investment>(
    `/investments?itemId=${encodeURIComponent(itemId)}&pageSize=500`
  )
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

async function saveItemMetadata(item: Item, userId: string) {
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
}

function itemUpdatedAfter(item: Item, previousLastUpdatedAt: Date | null): boolean {
  if (!item.lastUpdatedAt) return false
  if (!previousLastUpdatedAt) return true
  return new Date(item.lastUpdatedAt).getTime() > previousLastUpdatedAt.getTime()
}

function itemHasUsableData(item: Item): boolean {
  // O SDK ainda não tipa PARTIAL_SUCCESS, embora a API regulada o devolva
  // quando só um produto (ex.: investimentos) falha e os demais estão válidos.
  return ['UPDATED', 'PARTIAL_SUCCESS'].includes(String(item.status))
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export async function syncPluggyItem(itemId: string, expectedUserId?: string) {
  console.info('[pluggy-sync] started', { itemId, expectedUserId })
  const item = await pluggyRequest<Item>(`/items/${encodeURIComponent(itemId)}`)
  const userId = await resolveOwner(item, expectedUserId)

  await saveItemMetadata(item, userId)

  if (!itemHasUsableData(item)) {
    const result = { itemId: item.id, status: item.status, accounts: 0, transactions: 0 }
    console.info('[pluggy-sync] skipped', result)
    return result
  }

  const [accountResponse, investmentRows] = await Promise.all([
    pluggyRequest<{ results: Account[] }>(`/accounts?itemId=${encodeURIComponent(item.id)}`),
    listInvestments(item.id),
  ])
  const accountRows = accountResponse.results
  const investments: SyncedInvestment[] = investmentRows
    .filter(
      (investment) =>
        investment.status !== 'TOTAL_WITHDRAWAL' && Number.isFinite(Number(investment.balance))
    )
    .map((investment) => ({
      id: investment.id,
      type: investment.type,
      name: investment.name,
      number: investment.number,
      balance: Number(investment.balance),
    }))

  // Alguns conectores antigos não expõem o produto Investments, mas informam
  // o saldo aplicado automaticamente dentro da própria conta bancária.
  if (investments.length === 0) {
    for (const account of accountRows) {
      const bankData = account.bankData as
        | (typeof account.bankData & { automaticallyInvestedBalance?: number | null })
        | null
      const automaticallyInvested = Number(bankData?.automaticallyInvestedBalance ?? 0)
      if (account.type !== 'BANK' || automaticallyInvested <= 0) continue
      investments.push({
        id: `automatic:${account.id}`,
        type: 'FIXED_INCOME',
        name: `${account.marketingName || account.name || 'Conta'} · saldo aplicado`,
        number: account.number,
        balance: automaticallyInvested,
      })
    }
  }
  // As contas são independentes. Ler transações e faturas em paralelo reduz o
  // tempo do botão “Sincronizar” sem misturar gravações concorrentes no banco.
  const accountData = await Promise.all(
    accountRows.map(async (account) => ({
      account,
      transactions: await listTransactions(account.id),
      bills: account.type === 'CREDIT' ? await listBills(account.id) : [],
    }))
  )
  const cardIdsByAccount = new Map<string, number>()

  for (const { account, transactions, bills } of accountData) {
    let cardId: number | null = null

    if (account.type === 'CREDIT') {
      const informedDueDate = safeDate(account.creditData?.balanceDueDate)
      const informedCloseDate = safeDate(account.creditData?.balanceCloseDate)
      const creditLimit = Math.max(Number(account.creditData?.creditLimit ?? 0), 0)
      const availableLimit = Math.max(Number(account.creditData?.availableCreditLimit ?? 0), 0)
      const currentInvoice = calculateCurrentInvoice({
        transactions,
        bills,
        dueDate: informedDueDate,
        closeDate: informedCloseDate,
      })
      const dueDate = currentInvoice.dueDate ?? informedDueDate
      const closeDate = currentInvoice.closeDate ?? informedCloseDate
      const number = (account.number ?? '').replace(/\D/g, '').slice(-4) || '0000'

      const [syncedCard] = await db
        .insert(cards)
        .values({
          user_id: userId,
          nome: account.marketingName || account.name || item.connector?.name || 'Cartão',
          tipo: 'crédito',
          numero: number,
          cor: institutionColor(item.connector?.name),
          limite: String(creditLimit),
          limite_disponivel: String(availableLimit),
          dia_vencimento: dueDate?.getUTCDate() ?? 1,
          dias_fechamento_antes: daysBetween(dueDate, closeDate),
          pluggy_account_id: account.id,
          instituicao: item.connector?.name,
          bandeira: account.creditData?.brand,
          fatura_atual: String(currentInvoice.amount),
          fechamento_em: closeDate,
          vencimento_em: dueDate,
          sincronizado: true,
        })
        .onConflictDoUpdate({
          target: cards.pluggy_account_id,
          set: {
            nome: account.marketingName || account.name || item.connector?.name || 'Cartão',
            numero: number,
            cor: institutionColor(item.connector?.name),
            limite: String(creditLimit),
            limite_disponivel: String(availableLimit),
            dia_vencimento: dueDate?.getUTCDate() ?? 1,
            dias_fechamento_antes: daysBetween(dueDate, closeDate),
            instituicao: item.connector?.name,
            bandeira: account.creditData?.brand,
            fatura_atual: String(currentInvoice.amount),
            fechamento_em: closeDate,
            vencimento_em: dueDate,
            sincronizado: true,
            updated_at: new Date(),
          },
        })
        .returning({ id: cards.id })

      cardId = syncedCard.id
      cardIdsByAccount.set(account.id, cardId)
    }

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
        card_id: cardId,
      })
      .onConflictDoUpdate({
        target: pluggyAccounts.account_id,
        set: {
          type: account.type,
          subtype: account.subtype,
          nome: account.marketingName || account.name,
          numero: account.number,
          saldo: String(account.balance ?? 0),
          card_id: cardId,
          updated_at: new Date(),
        },
      })
  }

  // Cofrinhos, CDBs e outros investimentos são produtos separados na Pluggy.
  // Guardá-los como contas sintéticas permite compor o patrimônio disponível
  // sem criar uma migração e sem confundir esses valores com conta corrente.
  await db
    .delete(pluggyAccounts)
    .where(
      and(
        eq(pluggyAccounts.user_id, userId),
        eq(pluggyAccounts.item_id, item.id),
        eq(pluggyAccounts.type, 'INVESTMENT')
      )
    )

  for (const investment of investments) {
    await db
      .insert(pluggyAccounts)
      .values({
        user_id: userId,
        item_id: item.id,
        account_id: `investment:${investment.id}`,
        type: 'INVESTMENT',
        subtype: investment.type,
        nome: investment.name,
        numero: investment.number,
        saldo: String(investment.balance),
        card_id: null,
      })
      .onConflictDoUpdate({
        target: pluggyAccounts.account_id,
        set: {
          subtype: investment.type,
          nome: investment.name,
          numero: investment.number,
          saldo: String(investment.balance),
          updated_at: new Date(),
        },
      })
  }

  await ensureDefaultCategories(userId)
  const userCategories = await db
    .select({ id: categories.id, nome: categories.nome, tipo: categories.tipo })
    .from(categories)
    .where(eq(categories.user_id, userId))

  const transactionCount = accountData.reduce(
    (total, result) => total + result.transactions.length,
    0
  )
  const expenseRows: Array<typeof expenses.$inferInsert> = []
  const incomeRows: Array<typeof incomes.$inferInsert> = []
  const pendingCategories: Array<{
    index: number
    description: string
    type: 'expense' | 'income'
    apply: (categoryId: number | null) => void
  }> = []

  for (const { account, transactions } of accountData) {
    for (const transaction of transactions) {
      if (!Number.isFinite(transaction.amount) || transaction.amount === 0) continue

      const direction = transactionDirection(transaction, account.type)
      const categoryId = categorizeByRules(
        {
          description: transaction.description,
          merchantName: transaction.merchant?.name ?? transaction.merchant?.businessName,
          providerCategory: transaction.category,
          operationType: transaction.operationType,
          type: direction,
        },
        userCategories
      )
      const transactionDate = transactionDateInBrazil(transaction.date)
      const quantity = Math.abs(transaction.amount).toFixed(2)

      if (direction === 'expense') {
        const row: typeof expenses.$inferInsert = {
          user_id: userId,
          pluggy_transaction_id: transaction.id,
          pluggy_account_id: account.id,
          origem: 'pluggy',
          metodo_pagamento: account.type === 'CREDIT' ? 'Cartão de crédito' : 'Conta bancária',
          tipo: transaction.merchant?.name || transaction.description,
          quantidade: quantity,
          data: transactionDate,
          parcelas: transaction.creditCardMetadata?.totalInstallments ?? null,
          card_id: cardIdsByAccount.get(account.id) ?? null,
          category_id: categoryId,
          observacoes: 'Sincronizado via Open Finance',
        }
        expenseRows.push(row)
        if (categoryId === null) {
          const pendingIndex = pendingCategories.length
          pendingCategories.push({
            index: pendingIndex,
            description: transaction.merchant?.name || transaction.description,
            type: direction,
            apply: (assignedCategory) => { row.category_id = assignedCategory },
          })
        }
      } else {
        const row: typeof incomes.$inferInsert = {
          user_id: userId,
          pluggy_transaction_id: transaction.id,
          pluggy_account_id: account.id,
          origem: 'pluggy',
          tipo: transaction.merchant?.name || transaction.description,
          quantidade: quantity,
          data: transactionDate,
          fonte: account.marketingName || account.name || 'Open Finance',
          nota: 'Sincronizado via Open Finance',
          category_id: categoryId,
        }
        incomeRows.push(row)
        if (categoryId === null) {
          const pendingIndex = pendingCategories.length
          pendingCategories.push({
            index: pendingIndex,
            description: transaction.merchant?.name || transaction.description,
            type: direction,
            apply: (assignedCategory) => { row.category_id = assignedCategory },
          })
        }
      }
    }
  }

  const fallbackCategory = (type: 'expense' | 'income') => {
    const fallbackName = type === 'income' ? 'outros rendimentos' : 'outros'
    return userCategories.find(
      (category) =>
        category.tipo === (type === 'income' ? 'receita' : 'despesa') &&
        category.nome
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase() === fallbackName
    )?.id ?? null
  }

  // IA somente no que as regras locais não reconheceram. Processar em lotes
  // pequenos mantém a chamada dentro do TPM do plano grátis do Groq.
  for (const batch of batches(pendingCategories, AI_CATEGORY_BATCH_SIZE)) {
    const assignments = await categorizeWithLlm(
      batch.map(({ index, description, type }) => ({ index, description, type })),
      userCategories
    )
    for (const pending of batch) {
      pending.apply(assignments[pending.index] ?? fallbackCategory(pending.type))
    }
  }

  await db.transaction(async (tx) => {
    for (const ids of batches(expenseRows.map((row) => row.pluggy_transaction_id!))) {
      await tx.delete(incomes).where(
        and(eq(incomes.user_id, userId), inArray(incomes.pluggy_transaction_id, ids))
      )
    }
    for (const ids of batches(incomeRows.map((row) => row.pluggy_transaction_id!))) {
      await tx.delete(expenses).where(
        and(eq(expenses.user_id, userId), inArray(expenses.pluggy_transaction_id, ids))
      )
    }

    for (const rows of batches(expenseRows)) {
      await tx.insert(expenses).values(rows).onConflictDoUpdate({
        target: expenses.pluggy_transaction_id,
        targetWhere: sql`${expenses.pluggy_transaction_id} IS NOT NULL`,
        set: {
          pluggy_account_id: sql`excluded.pluggy_account_id`,
          origem: 'pluggy',
          metodo_pagamento: sql`excluded.metodo_pagamento`,
          tipo: sql`excluded.tipo`,
          quantidade: sql`excluded.quantidade`,
          data: sql`excluded.data`,
          parcelas: sql`excluded.parcelas`,
          card_id: sql`excluded.card_id`,
          category_id: sql`case when ${expenses.categoria_manual} then ${expenses.category_id} else excluded.category_id end`,
          updated_at: new Date(),
        },
      })
    }
    for (const rows of batches(incomeRows)) {
      await tx.insert(incomes).values(rows).onConflictDoUpdate({
        target: incomes.pluggy_transaction_id,
        targetWhere: sql`${incomes.pluggy_transaction_id} IS NOT NULL`,
        set: {
          pluggy_account_id: sql`excluded.pluggy_account_id`,
          origem: 'pluggy',
          tipo: sql`excluded.tipo`,
          quantidade: sql`excluded.quantidade`,
          data: sql`excluded.data`,
          fonte: sql`excluded.fonte`,
          category_id: sql`case when ${incomes.categoria_manual} then ${incomes.category_id} else excluded.category_id end`,
          updated_at: new Date(),
        },
      })
    }
  })

  await db
    .update(pluggyItems)
    .set({
      status: item.status,
      // Este campo representa a última coleta da instituição, não o momento
      // em que o Nexus releu o cache da Pluggy.
      last_synced_at: item.lastUpdatedAt ? new Date(item.lastUpdatedAt) : null,
      updated_at: new Date(),
    })
    .where(and(eq(pluggyItems.item_id, item.id), eq(pluggyItems.user_id, userId)))

  const result = {
    itemId: item.id,
    status: item.status,
    accounts: accountRows.length,
    investments: investments.length,
    transactions: transactionCount,
    expenses: expenseRows.length,
    incomes: incomeRows.length,
  }
  console.info('[pluggy-sync] completed', result)
  return result
}

/**
 * Solicita à Pluggy uma nova coleta na instituição. O PATCH é o passo que
 * realmente conversa com o banco; ler /items, /accounts e /transactions só
 * devolve o último cache disponível.
 */
export async function refreshPluggyItem(itemId: string, expectedUserId: string) {
  const path = `/items/${encodeURIComponent(itemId)}`
  const currentItem = await pluggyRequest<Item>(path)
  const userId = await resolveOwner(currentItem, expectedUserId)
  const previousLastUpdatedAt = currentItem.lastUpdatedAt
    ? new Date(currentItem.lastUpdatedAt)
    : null

  console.info('[pluggy-refresh] requesting institution update', {
    itemId,
    userId,
    previousLastUpdatedAt,
  })

  let requestedItem: Item
  try {
    requestedItem = await pluggyRequest<Item>(path, {
      method: 'PATCH',
      body: JSON.stringify({}),
    })
  } catch (error) {
    // A Pluggy limita a frequência de atualização por instituição. Mesmo
    // quando a nova coleta ainda não é permitida, reaplicamos o cache mais
    // recente para reparar webhooks atrasados sem dizer que o banco atualizou.
    if (error instanceof PluggyApiError && error.status === 409) {
      const cached = await syncPluggyItem(itemId, userId)
      console.info('[pluggy-refresh] update rate limited; cached data imported', { itemId })
      return {
        ...cached,
        updateRequested: false,
        synchronized: true,
        refreshLimited: true,
      }
    }
    throw error
  }

  await saveItemMetadata(requestedItem, userId)

  if (itemHasUsableData(requestedItem)) {
    const synchronized = await syncPluggyItem(itemId, userId)
    return {
      ...synchronized,
      updateRequested: true,
      synchronized: true,
      refreshLimited: false,
    }
  }

  if (requestedItem.status !== 'UPDATING') {
    return {
      itemId,
      status: requestedItem.status,
      updateRequested: true,
      synchronized: false,
      refreshLimited: false,
      requiresUserInput: requestedItem.status === 'WAITING_USER_INPUT',
    }
  }

  const deadline = Date.now() + UPDATE_POLL_TIMEOUT_MS
  while (Date.now() < deadline) {
    await wait(UPDATE_POLL_INTERVAL_MS)
    const polledItem = await pluggyRequest<Item>(path)
    await saveItemMetadata(polledItem, userId)

    if (itemHasUsableData(polledItem) && itemUpdatedAfter(polledItem, previousLastUpdatedAt)) {
      const synchronized = await syncPluggyItem(itemId, userId)
      return {
        ...synchronized,
        updateRequested: true,
        synchronized: true,
        refreshLimited: false,
      }
    }

    if (polledItem.status !== 'UPDATING') {
      return {
        itemId,
        status: polledItem.status,
        updateRequested: true,
        synchronized: false,
        refreshLimited: false,
        requiresUserInput: polledItem.status === 'WAITING_USER_INPUT',
      }
    }
  }

  console.info('[pluggy-refresh] update still processing; webhook will import it', { itemId })
  return {
    itemId,
    status: 'UPDATING',
    updateRequested: true,
    synchronized: false,
    refreshLimited: false,
    requiresUserInput: false,
  }
}

export async function deletePluggyTransactions(ids: string[]) {
  if (!ids.length) return
  await Promise.all([
    db.delete(expenses).where(inArray(expenses.pluggy_transaction_id, ids)),
    db.delete(incomes).where(inArray(incomes.pluggy_transaction_id, ids)),
  ])
}

export async function deletePluggyItemData(itemId: string, expectedUserId?: string) {
  const itemCondition = expectedUserId
    ? and(eq(pluggyItems.item_id, itemId), eq(pluggyItems.user_id, expectedUserId))
    : eq(pluggyItems.item_id, itemId)
  const accountCondition = expectedUserId
    ? and(eq(pluggyAccounts.item_id, itemId), eq(pluggyAccounts.user_id, expectedUserId))
    : eq(pluggyAccounts.item_id, itemId)

  await db.transaction(async (tx) => {
    const accountRows = await tx
      .select({ id: pluggyAccounts.account_id, userId: pluggyAccounts.user_id, cardId: pluggyAccounts.card_id })
      .from(pluggyAccounts)
      .where(accountCondition)

    for (const account of accountRows) {
      const expenseCondition = expectedUserId
        ? and(eq(expenses.pluggy_account_id, account.id), eq(expenses.user_id, expectedUserId))
        : eq(expenses.pluggy_account_id, account.id)
      const incomeCondition = expectedUserId
        ? and(eq(incomes.pluggy_account_id, account.id), eq(incomes.user_id, expectedUserId))
        : eq(incomes.pluggy_account_id, account.id)
      await tx.delete(expenses).where(expenseCondition)
      await tx.delete(incomes).where(incomeCondition)
    }

    await tx.delete(pluggyAccounts).where(accountCondition)
    const syncedCardIds = accountRows
      .map((account) => account.cardId)
      .filter((cardId): cardId is number => cardId !== null)
    if (syncedCardIds.length > 0) {
      await tx.delete(cards).where(inArray(cards.id, syncedCardIds))
    }
    await tx.delete(pluggyItems).where(itemCondition)
  })
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
