export type PluggyTransactionDirection = 'expense' | 'income'

type DirectionInput = {
  type?: string | null
  amount: number
}

/**
 * A Pluggy define `DEBIT` como saída e `CREDIT` como entrada. O sinal não é
 * confiável para isso: em cartão, uma compra é positiva e o pagamento da
 * fatura é negativo. O fallback por sinal só atende respostas legadas.
 */
export function transactionDirection(
  transaction: DirectionInput,
  accountType: string
): PluggyTransactionDirection {
  const type = transaction.type?.toUpperCase()
  if (type === 'DEBIT') return 'expense'
  if (type === 'CREDIT') return 'income'

  if (accountType.toUpperCase() === 'CREDIT') {
    return transaction.amount >= 0 ? 'expense' : 'income'
  }
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
