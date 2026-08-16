export interface InvoiceForReconciliation {
  instituicao: string | null
  numero: string
  total_gasto: number
}

export interface ReconciledInvoice {
  amount: number
  reconciled: boolean
  reference: string | null
}

interface StatementInvoiceReconciliation {
  institution: string
  lastFour: string
  amount: number
  activeFrom: string
  activeUntil: string
  reference: string
}

/**
 * Valores conferidos nos documentos bancários enviados pelo titular.
 *
 * A Pluggy trouxe lançamentos incompletos/distorcidos neste ciclo (inclusive
 * uma cobrança do ChatGPT com valor incorreto). A conciliação é deliberadamente
 * limitada à fatura de setembro/2026; depois dela, a fonte volta a ser a fatura
 * sincronizada normalmente.
 */
const STATEMENT_INVOICE_RECONCILIATIONS: StatementInvoiceReconciliation[] = [
  {
    institution: 'nubank',
    lastFour: '6365',
    amount: 2370.05,
    activeFrom: '2026-08-01',
    activeUntil: '2026-09-30',
    reference: 'Fatura Nubank 09/2026',
  },
  {
    institution: 'mercado pago',
    lastFour: '1692',
    amount: 963.68,
    activeFrom: '2026-08-01',
    activeUntil: '2026-09-30',
    reference: 'Fatura Mercado Pago 09/2026',
  },
]

function normalize(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function brazilDateKey(referenceDate: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(referenceDate)
}

export function reconcileOpenInvoice(
  invoice: InvoiceForReconciliation,
  referenceDate = new Date()
): ReconciledInvoice {
  const today = brazilDateKey(referenceDate)
  const institution = normalize(invoice.instituicao)
  const lastFour = invoice.numero.replace(/\D/g, '').slice(-4)
  const reconciliation = STATEMENT_INVOICE_RECONCILIATIONS.find(
    (item) =>
      institution.includes(item.institution) &&
      lastFour === item.lastFour &&
      today >= item.activeFrom &&
      today <= item.activeUntil
  )

  if (!reconciliation) {
    return {
      amount: roundMoney(invoice.total_gasto),
      reconciled: false,
      reference: null,
    }
  }

  return {
    amount: reconciliation.amount,
    reconciled: true,
    reference: reconciliation.reference,
  }
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function calculateFinancialPosition(available: number, openInvoices: number): number {
  return roundMoney(available - openInvoices)
}
