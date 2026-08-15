export type PluggyInstallmentMetadata = {
  installmentNumber?: number | null
  totalInstallments?: number | null
  billForecastDate?: string | null
}

function civilDateParts(value?: string | null) {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (year < 2000 || month < 1 || month > 12 || day < 1 || day > 31) return null
  return { year, month, day }
}

function dateInMonth(year: number, month: number, day: number) {
  const lastDay = new Date(Date.UTC(year, month, 0, 12)).getUTCDate()
  return new Date(Date.UTC(year, month - 1, Math.min(day, lastDay), 12))
}

/** Exibe a parcela devolvida pela Pluggy sem duplicar sufixos já presentes. */
export function installmentDescription(
  description: string,
  metadata?: PluggyInstallmentMetadata | null
): string {
  const current = metadata?.installmentNumber
  const total = metadata?.totalInstallments

  if (!current || !total || current < 1 || total < 2 || current > total) return description
  if (new RegExp(`\\b${current}\\s*[/\\-]\\s*${total}\\b`).test(description)) {
    return description
  }

  return `${description} ${current}/${total}`
}

/**
 * Para cartão, a competência correta é o mês previsto da fatura, não o mês
 * original da compra. A data civil continua ao meio-dia UTC para o driver PG.
 */
export function installmentAccountingDate(
  transactionDate: Date,
  metadata?: PluggyInstallmentMetadata | null,
  billDueDate?: string | null
): Date {
  const forecast = metadata?.billForecastDate?.match(/^(\d{4})-(\d{2})/)
  if (forecast) {
    const year = Number(forecast[1])
    const month = Number(forecast[2])
    if (year >= 2000 && month >= 1 && month <= 12) {
      return dateInMonth(year, month, transactionDate.getUTCDate())
    }
  }

  const bill = civilDateParts(billDueDate)
  if (bill) return dateInMonth(bill.year, bill.month, transactionDate.getUTCDate())

  // Sem competência explícita, respeita a data efetivamente lançada pelo
  // banco. Em estornos, a instituição pode antecipar parcelas para o mês atual.
  return transactionDate
}

export function cardTransactionDates(
  transactionDate: Date,
  status?: string | null,
  metadata?: PluggyInstallmentMetadata | null,
  billDueDate?: string | null
) {
  const competenceDate = installmentAccountingDate(
    transactionDate,
    metadata,
    billDueDate
  )
  const pending = status?.toUpperCase() === 'PENDING'

  return {
    // Transações já efetivadas sempre aparecem no dia real da compra. Uma
    // previsão PENDING conserva a data da fatura apenas para projeções e fica
    // fora da lista/totais até o banco confirmá-la.
    activityDate: pending ? competenceDate : transactionDate,
    competenceDate,
    pending,
  }
}
