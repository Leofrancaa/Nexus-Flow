import { NextRequest } from 'next/server'
import { getAuthUser, unauthorizedResponse } from '@/server/lib/auth'
import { ok, apiError } from '@/server/lib/apiResponse'
import {
    getSaldoFuturo,
    getSaldoAtual,
    getSaldoConectado,
    getTotaisMensais,
    getComparativoMensal,
    getGastosPorCategoria,
    getGastosPorCartao,
    getTopCategoriasGasto,
    getCartoesEstourados,
    getCartoesAVencer,
    getParcelasPendentes,
    getResumoAnual,
    getAssinaturasDoMes,
} from '@/server/utils/finance/index'
import { DashboardData } from '@/server/types/index'
import { ensureDefaultCategories } from '@/server/services/defaultCategoryService'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return unauthorizedResponse()

    await ensureDefaultCategories(user.id)

    const now = new Date()
    const mes = now.getMonth() + 1
    const ano = now.getFullYear()

    const [
      saldoLancamentos,
      saldoConectado,
      totaisMensais,
      comparativo,
      porCategoria,
      porCartao,
      topCategorias,
      cartoesEstourados,
      cartoesAVencer,
      parcelasPendentes,
      resumoAnual,
      assinaturas
    ] = await Promise.all([
      getSaldoAtual(user.id),
      getSaldoConectado(user.id),
      getTotaisMensais(user.id, ano),
      getComparativoMensal(user.id, mes, ano),
      getGastosPorCategoria(user.id, mes, ano),
      getGastosPorCartao(user.id, mes, ano),
      getTopCategoriasGasto(user.id, mes, ano),
      getCartoesEstourados(user.id),
      getCartoesAVencer(user.id),
      getParcelasPendentes(user.id),
      getResumoAnual(user.id, ano),
      getAssinaturasDoMes(user.id, mes, ano)
    ])

    const temSaldoConectado = saldoConectado.produtos > 0
    const saldo = temSaldoConectado ? saldoConectado.total : saldoLancamentos
    const saldoFuturo = await getSaldoFuturo(user.id, saldo)

    const dashboardData: DashboardData = {
      saldo,
      saldoFuturo,
      saldoOrigem: temSaldoConectado ? 'contas' : 'lancamentos',
      saldoInvestimentos: saldoConectado.investimentos,
      totaisMensais: totaisMensais.receitas.map((receita, index) => ({
        mes: receita.mes,
        receitas: receita.total,
        despesas: totaisMensais.despesas[index]?.total || 0
      })),
      resumoAnual,
      comparativo,
      gastosPorCategoria: porCategoria,
      topCategorias,
      gastosPorCartao: porCartao,
      parcelasPendentes,
      cartoesEstourados,
      cartoesAVencer,
      assinaturas
    }

    return ok(dashboardData, 'Dados do dashboard carregados com sucesso')
  } catch (error) {
    return apiError(error, 'Erro ao carregar dados do dashboard.')
  }
}
