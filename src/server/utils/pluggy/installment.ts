export type PluggyInstallmentMetadata = {
  installmentNumber?: number | null
  totalInstallments?: number | null
  billForecastDate?: string | null
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
  metadata?: PluggyInstallmentMetadata | null
): Date {
  const forecast = metadata?.billForecastDate?.match(/^(\d{4})-(\d{2})/)
  if (!forecast) return transactionDate

  const year = Number(forecast[1])
  const month = Number(forecast[2])
  if (year < 2000 || month < 1 || month > 12) return transactionDate

  const lastDay = new Date(Date.UTC(year, month, 0, 12)).getUTCDate()
  const day = Math.min(transactionDate.getUTCDate(), lastDay)
  return new Date(Date.UTC(year, month - 1, day, 12))
}
