export interface InvoiceForReconciliation {
  instituicao: string | null
  numero: string
  total_gasto: number
  expensesAfterStatement?: number
  creditsAfterStatement?: number
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
  statementThrough: string
  invoiceMonth: number
  invoiceYear: number
  reference: string
}

export interface InvoiceReconciliationWindow {
  statementThrough: string
  invoiceMonth: number
  invoiceYear: number
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
    statementThrough: '2026-08-16',
    invoiceMonth: 9,
    invoiceYear: 2026,
    reference: 'Fatura Nubank 09/2026',
  },
  {
    institution: 'mercado pago',
    lastFour: '1692',
    amount: 963.68,
    activeFrom: '2026-08-01',
    activeUntil: '2026-09-30',
    statementThrough: '2026-08-16',
    invoiceMonth: 9,
    invoiceYear: 2026,
    reference: 'Fatura Mercado Pago 09/2026',
  },
]

function normalize(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function brazilDateKey(referenceDate: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(referenceDate)
}

function findReconciliation(
  invoice: Pick<InvoiceForReconciliation, 'instituicao' | 'numero'>,
  referenceDate: Date
): StatementInvoiceReconciliation | undefined {
  const today = brazilDateKey(referenceDate)
  const institution = normalize(invoice.instituicao)
  const lastFour = invoice.numero.replace(/\D/g, '').slice(-4)
  return STATEMENT_INVOICE_RECONCILIATIONS.find(
    (item) =>
      institution.includes(item.institution) &&
      lastFour === item.lastFour &&
      today >= item.activeFrom &&
      today <= item.activeUntil
  )
}

export function getInvoiceReconciliationWindow(
  invoice: Pick<InvoiceForReconciliation, 'instituicao' | 'numero'>,
  referenceDate = new Date()
): InvoiceReconciliationWindow | null {
  const reconciliation = findReconciliation(invoice, referenceDate)
  if (!reconciliation) return null
  return {
    statementThrough: reconciliation.statementThrough,
    invoiceMonth: reconciliation.invoiceMonth,
    invoiceYear: reconciliation.invoiceYear,
  }
}

export function reconcileOpenInvoice(
  invoice: InvoiceForReconciliation,
  referenceDate = new Date()
): ReconciledInvoice {
  const reconciliation = findReconciliation(invoice, referenceDate)

  if (!reconciliation) {
    return {
      amount: roundMoney(invoice.total_gasto),
      reconciled: false,
      reference: null,
    }
  }

  return {
    amount: Math.max(
      roundMoney(
        reconciliation.amount +
          Number(invoice.expensesAfterStatement ?? 0) -
          Number(invoice.creditsAfterStatement ?? 0)
      ),
      0
    ),
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
