import { NextRequest } from 'next/server'
import { getAuthUser, unauthorizedResponse } from '@/server/lib/auth'
import { ok, err, apiError } from '@/server/lib/apiResponse'
import { CardInvoiceService } from '@/server/services/cardInvoiceService'
import { toNumber } from '@/server/utils/helper'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthUser(request)
    if (!user) return unauthorizedResponse()

    const { id } = await params
    const card_id = toNumber(id)
    if (!card_id) return err('ID do cartão inválido.', 400)

    // Mês/ano são opcionais: sem eles o service calcula a competência da
    // próxima fatura a vencer (que é a fatura que o usuário vê no cartão).
    const body = await request.json().catch(() => ({}))
    const { mes, ano } = body ?? {}

    if ((mes !== undefined || ano !== undefined) && (typeof mes !== 'number' || typeof ano !== 'number')) {
      return err('Quando informados, mês e ano devem ser números.', 400)
    }

    const result = await CardInvoiceService.payCardInvoice({
      user_id: user.id,
      card_id,
      mes: typeof mes === 'number' ? mes : undefined,
      ano: typeof ano === 'number' ? ano : undefined,
    })
    return ok(result, 'Fatura paga e limite atualizado com sucesso.')
  } catch (error) {
    return apiError(error, 'Erro ao pagar fatura.')
  }
}
