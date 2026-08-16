import { dataLocal, type Activity } from "@/lib/activities";

/**
 * Gasto acumulado, dia a dia, dentro do mês corrente.
 *
 * A curva que interessa no painel é a do mês em andamento: ela sobe, e a
 * inclinação mostra o ritmo do gasto. Uma série de totais mensais responderia
 * outra pergunta ("como foi o ano") e ficaria plana quase sempre.
 *
 * Vai até hoje, não até o fim do mês — projetar dias que ainda não
 * aconteceram desenharia uma reta achatada no fim do gráfico.
 */
export function gastoAcumuladoPorDia(
  itens: Activity[],
  hoje: Date = new Date()
): number[] {
  const mes = hoje.getMonth();
  const ano = hoje.getFullYear();
  const diaAtual = hoje.getDate();

  const porDia = new Array<number>(diaAtual + 1).fill(0);

  for (const item of itens) {
    if (item.natureza !== "expense") continue;

    const data = dataLocal(item.dataPeriodo ?? item.data);
    if (data.getMonth() !== mes || data.getFullYear() !== ano) continue;

    const dia = data.getDate();
    // Lançamento com data futura dentro do mês entra no último ponto, para o
    // total da curva bater com o total do card.
    porDia[Math.min(dia, diaAtual)] += item.valor;
  }

  const acumulado: number[] = [];
  let soma = 0;
  for (let dia = 1; dia <= diaAtual; dia++) {
    soma += porDia[dia];
    acumulado.push(soma);
  }

  return acumulado;
}
