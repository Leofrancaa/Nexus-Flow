import { NextRequest } from 'next/server'
import { getAuthUser, unauthorizedResponse } from '@/server/lib/auth'
import { ok, err, apiError } from '@/server/lib/apiResponse'
import { CurrencyService } from '@/server/services/currencyService'

export async function POST(request: NextRequest) {
  try {
    // Era a única rota da pasta sem checagem de sessão. Não expunha dado do
    // usuário, mas deixava qualquer um gastar a cota da API de câmbio.
    const user = await getAuthUser(request)
    if (!user) return unauthorizedResponse()

    const { amount, from_currency, to_currency } = await request.json()
    if (!amount || !from_currency || !to_currency) {
      return err('Amount, from_currency e to_currency são obrigatórios.', 400)
    }
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      return err('Amount deve ser um número positivo.', 400)
    }
    const result = await CurrencyService.convertCurrency(Number(amount), from_currency, to_currency)
    return ok(result, 'Conversão realizada com sucesso.')
  } catch (error) {
    return apiError(error, 'Erro ao converter moeda.')
  }
}
