import { NextRequest } from 'next/server'
import { getAuthUser, unauthorizedResponse } from '@/server/lib/auth'
import { ok, apiError } from '@/server/lib/apiResponse'
import {
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
import { calculateFinancialPosition, roundMoney } from '@/server/utils/finance/statementReconciliation'

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
    const temSaldoMercadoPago = saldoConectado.produtosMercadoPago > 0
    const entradasAcompanhamento = resumoAnual.reduce(
      (total, item) => total + Number(item.total_receitas),
      0
    )
    const saidasAcompanhamento = resumoAnual.reduce(
      (total, item) => total + Number(item.total_despesas),
      0
    )
    const faturasAbertas = roundMoney(
      cartoesAVencer.reduce((total, card) => total + Number(card.total_gasto), 0)
    )
    // Para o ciclo conciliado, o extrato confirma que o patrimônio disponível
    // é o saldo do Mercado Pago/cofrinho. Valores residuais de outros produtos
    // (como os R$ 1,57 reportados pelo Nubank) não entram nesta posição.
    const saldoDisponivel = temSaldoMercadoPago
      ? roundMoney(saldoConectado.mercadoPago)
      : temSaldoConectado
        ? roundMoney(saldoConectado.total)
        : roundMoney(saldoLancamentos)
    const saldo = calculateFinancialPosition(saldoDisponivel, faturasAbertas)
    // A projeção útil aqui é o que resta depois de quitar as obrigações já
    // abertas. Não somamos novamente compras da fatura nem todo o histórico.
    const saldoFuturo = saldo

    const dashboardData: DashboardData = {
      saldo,
      saldoFuturo,
      saldoOrigem: 'posicao',
      saldoFuturoOrigem: 'faturas',
      saldoInvestimentos: saldoDisponivel,
      posicaoFinanceira: {
        disponivel: saldoDisponivel,
        faturasAbertas,
      },
      acompanhamento: {
        entradas: entradasAcompanhamento,
        saidas: saidasAcompanhamento,
      },
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
