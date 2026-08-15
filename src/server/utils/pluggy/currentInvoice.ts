export interface CardInvoiceTransaction {
  amount: number
  date: string
  status?: string | null
  creditCardMetadata?: {
    billId?: string | null
    billForecastDate?: string | null
  } | null
}

export interface PluggyCardBill {
  id?: string | null
  totalAmount: number
  dueDate: string
  billClosingDate?: string | null
}

export interface CurrentInvoice {
  amount: number
  dueDate: Date | null
  closeDate: Date | null
  source: 'bill' | 'transactions' | 'unavailable'
}

const DAY_MS = 86_400_000

function utcDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null
  const parsed = value instanceof Date ? new Date(value) : new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()))
}

function addUtcMonths(value: Date, months: number): Date {
  const target = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + months, 1))
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
  ).getUTCDate()
  target.setUTCDate(Math.min(value.getUTCDate(), lastDay))
  return target
}

function monthKey(value: Date): string {
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}`
}

function currentCycle(
  dueDateValue: Date | string | null | undefined,
  closeDateValue: Date | string | null | undefined,
  now: Date
) {
  const today = utcDate(now)!
  const originalDue = utcDate(dueDateValue)
  const originalClose = utcDate(closeDateValue)
  if (!originalDue) return null

  const informedLead = originalClose
    ? Math.round((originalDue.getTime() - originalClose.getTime()) / DAY_MS)
    : 10
  const closingLead = informedLead >= 1 && informedLead <= 31 ? informedLead : 10

  let dueDate = originalDue
  while (dueDate < today) dueDate = addUtcMonths(dueDate, 1)

  const closeDate = new Date(dueDate.getTime() - closingLead * DAY_MS)
  const previousCloseDate = addUtcMonths(closeDate, -1)
  return { dueDate, closeDate, previousCloseDate }
}

/**
 * O `Account.balance` da Pluggy não é usado aqui: em conexões Open Finance ele
 * representa todo o limite comprometido, incluindo parcelas futuras. A fatura
 * corrente vem primeiro da entidade Bill e, enquanto ela ainda está aberta,
 * dos lançamentos associados ao ciclo/competência previstos pelo banco.
 */
export function calculateCurrentInvoice({
  transactions,
  bills,
  dueDate,
  closeDate,
  now = new Date(),
}: {
  transactions: CardInvoiceTransaction[]
  bills?: PluggyCardBill[]
  dueDate?: Date | string | null
  closeDate?: Date | string | null
  now?: Date
}): CurrentInvoice {
  const today = utcDate(now)!
  const openOrUpcomingBill = (bills ?? [])
    .map((bill) => ({ bill, due: utcDate(bill.dueDate) }))
    .filter(
      (entry): entry is { bill: PluggyCardBill; due: Date } =>
        entry.due !== null && entry.due >= today && Number.isFinite(entry.bill.totalAmount)
    )
    .sort((a, b) => a.due.getTime() - b.due.getTime())[0]

  if (openOrUpcomingBill) {
    const informedClose = utcDate(openOrUpcomingBill.bill.billClosingDate)
    const accountCycle = currentCycle(dueDate, closeDate, now)
    return {
      amount: Math.max(Number(openOrUpcomingBill.bill.totalAmount), 0),
      dueDate: openOrUpcomingBill.due,
      closeDate: informedClose ?? accountCycle?.closeDate ?? null,
      source: 'bill',
    }
  }

  const cycle = currentCycle(dueDate, closeDate, now)
  if (!cycle) {
    return { amount: 0, dueDate: null, closeDate: null, source: 'unavailable' }
  }

  const dueKey = monthKey(cycle.dueDate)
  const closeKey = monthKey(cycle.closeDate)
  const forecastForDue = transactions.filter(
    (transaction) => transaction.creditCardMetadata?.billForecastDate === dueKey
  )
  const forecastForClose = transactions.filter(
    (transaction) => transaction.creditCardMetadata?.billForecastDate === closeKey
  )
  const forecastMatches = forecastForDue.length > 0 ? forecastForDue : forecastForClose

  const matches = forecastMatches.length > 0
    ? forecastMatches
    : transactions.filter((transaction) => {
        const date = utcDate(transaction.date)
        if (!date) return false
        if (transaction.creditCardMetadata?.billId && transaction.status !== 'PENDING') return false
        return date > cycle.previousCloseDate && date <= cycle.closeDate
      })

  if (matches.length === 0) {
    return {
      amount: 0,
      dueDate: cycle.dueDate,
      closeDate: cycle.closeDate,
      source: 'unavailable',
    }
  }

  const amount = matches.reduce(
    (total, transaction) => total + (Number.isFinite(transaction.amount) ? transaction.amount : 0),
    0
  )
  return {
    amount: Math.max(amount, 0),
    dueDate: cycle.dueDate,
    closeDate: cycle.closeDate,
    source: 'transactions',
  }
}
