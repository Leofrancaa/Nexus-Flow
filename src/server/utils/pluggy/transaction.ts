export type PluggyTransactionDirection = 'expense' | 'income'

type DirectionInput = {
  type?: string | null
  amount: number
}

/**
 * Em contas bancárias, a Pluggy define `DEBIT` como saída e `CREDIT` como
 * entrada. Em cartões, porém, a própria convenção da API é pelo sinal: compra
 * positiva aumenta a fatura (saída) e crédito/pagamento negativo a reduz.
 */
export function transactionDirection(
  transaction: DirectionInput,
  accountType: string
): PluggyTransactionDirection {
  if (accountType.toUpperCase() === 'CREDIT') {
    return transaction.amount >= 0 ? 'expense' : 'income'
  }

  const type = transaction.type?.toUpperCase()
  if (type === 'DEBIT') return 'expense'
  if (type === 'CREDIT') return 'income'

  return transaction.amount < 0 ? 'expense' : 'income'
}

/** Converte o instante UTC da Pluggy para a data civil brasileira. */
export function transactionDateInBrazil(value: string): Date {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) throw new Error(`Data de transação inválida: ${value}`)

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(parsed)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value
  const dateOnly = `${part('year')}-${part('month')}-${part('day')}`

  // Meio-dia UTC mantém o mesmo dia ao passar pelo driver de `date` do PG.
  return new Date(`${dateOnly}T12:00:00.000Z`)
}
