"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import PageTitle from "../../components/pageTitle";

type Section = {
  id: string;
  title: string;
  body: React.ReactNode;
};

function AccordionItem({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border px-4 sm:px-5 py-3 sm:py-4 bg-[var(--card-bg)] border-[var(--card-border)]">
      <button
        className="w-full flex items-center justify-between gap-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-[var(--card-text)] font-semibold">{title}</span>
        <ChevronDown
          className={`w-5 h-5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          open ? "grid-rows-[1fr] mt-3" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden text-[var(--foreground)]/90 text-sm sm:text-base leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function ManualPage() {
  const [q, setQ] = useState("");

  const sections: Section[] = useMemo(
    () => [
      {
        id: "intro",
        title: "Introdução ao Nexus",
        body: (
          <>
            <p className="mb-3">
              Bem-vindo ao <strong>Nexus</strong>! Esta é uma ferramenta criada
              para ajudar você a{" "}
              <strong>organizar suas finanças pessoais</strong> de forma simples
              e prática. Com o Nexus, você pode controlar onde seu dinheiro está
              sendo gasto, planejar seus gastos futuros e ter uma visão clara da
              sua saúde financeira.
            </p>
            <p className="mb-3">
              O Nexus funciona como um assistente financeiro pessoal, onde você
              pode:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-3">
              <li>
                <strong>Anotar seus gastos</strong>: Registre todas as suas
                compras, contas e despesas do dia a dia, seja em dinheiro, pix
                ou cartão de crédito.
              </li>
              <li>
                <strong>Acompanhar sua renda</strong>: Registre seu salário,
                freelas e outras fontes de receita para saber quanto você ganhou
                no mês.
              </li>
              <li>
                <strong>Gerenciar cartões de crédito</strong>: Controle o
                limite, veja quanto ainda pode gastar e saiba quando vence cada
                fatura.
              </li>
              <li>
                <strong>Organizar por categorias</strong>: Agrupe seus gastos
                (exemplo: alimentação, transporte, lazer) para saber onde você
                gasta mais.
              </li>
              <li>
                <strong>Definir limites de gastos</strong>: Estabeleça quanto
                quer gastar em cada categoria e receba alertas quando estiver
                perto do limite.
              </li>
              <li>
                <strong>Ver gráficos e relatórios</strong>: Visualize seus
                gastos de forma clara através de gráficos coloridos e fáceis de
                entender.
              </li>
            </ul>
            <p className="mb-3">
              <strong>Como navegar no Nexus:</strong> Use o menu lateral (aquela
              barra à esquerda da tela) para acessar cada funcionalidade. Em
              telas menores, o menu aparece quando você clica no ícone de três
              linhas no canto superior.
            </p>
            <p className="mb-3">
              <strong>Recursos importantes:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Atualizações automáticas</strong>: Sempre que você
                adicionar, editar ou excluir algo, os totais e gráficos são
                recalculados na hora.
              </li>
              <li>
                <strong>Filtros de período</strong>: Na maioria das telas você
                pode escolher o mês e ano para ver informações específicas
                daquele período.
              </li>
              <li>
                <strong>Tema claro ou escuro</strong>: Escolha o tema que é mais
                confortável para seus olhos - há um botão para alternar no menu.
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "instalar-app",
        title: "Instalar no Celular",
        body: (
          <>
            <p className="mb-3">
              O <strong>Nexus</strong> pode ser instalado como um{" "}
              <strong>aplicativo</strong> no seu celular, funcionando em tela
              cheia e com acesso rápido a partir da tela inicial.
            </p>
            <p className="font-semibold mb-2">Android (Chrome, Edge, Brave)</p>
            <ul className="list-disc pl-5 space-y-1 mb-3">
              <li>Acesse o Nexus pelo navegador do celular.</li>
              <li>
                Toque no menu <strong>⋮</strong> no canto superior direito.
              </li>
              <li>
                Selecione <em>Adicionar à tela inicial</em> ou{" "}
                <em>Instalar app</em>.
              </li>
              <li>Confirme e o ícone aparecerá junto aos seus apps.</li>
            </ul>
            <p className="font-semibold mb-2">iOS (Safari)</p>
            <ul className="list-disc pl-5 space-y-1 mb-3">
              <li>Acesse o Nexus pelo Safari.</li>
              <li>
                Toque no botão de <em>Compartilhar</em> (ícone de quadrado com
                seta).
              </li>
              <li>
                Escolha <em>Adicionar à Tela de Início</em>.
              </li>
              <li>Confirme e o ícone aparecerá na tela inicial.</li>
            </ul>
            <p>
              Depois de instalado, o Nexus abrirá em <strong>tela cheia</strong>
              , sem a barra do navegador, proporcionando uma experiência mais
              parecida com um aplicativo nativo.
            </p>
          </>
        ),
      },

      {
        id: "dashboard",
        title: "Página Inicial (Dashboard)",
        body: (
          <>
            <p className="mb-3">
              A <strong>Dashboard</strong> é a primeira tela que você vê ao
              entrar no Nexus. Ela funciona como um resumo geral das suas
              finanças, mostrando de forma visual e organizada como está sua
              situação financeira no mês selecionado.
            </p>
            <p className="mb-3">
              <strong>O que você encontra na Dashboard:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-3">
              <li>
                <strong>Resumo em números</strong>: Quadrados coloridos
                (chamados de cards) mostram informações importantes como:
                <ul className="list-circle pl-6 mt-1 space-y-1">
                  <li>Quanto você gastou no total no mês</li>
                  <li>
                    Quantas despesas são fixas (aquelas que se repetem todo mês)
                  </li>
                  <li>
                    Número total de transações (compras e pagamentos) realizadas
                  </li>
                  <li>Valor médio que você gasta por transação</li>
                </ul>
              </li>
              <li>
                <strong>Comparação com o mês anterior</strong>: Setas e
                porcentagens mostram se você gastou mais ou menos que no mês
                passado. Seta verde para baixo significa que você economizou,
                seta vermelha para cima indica que gastou mais.
              </li>
              <li>
                <strong>Gráficos visuais</strong>: Gráficos coloridos em formato
                de pizza e barras que mostram:
                <ul className="list-circle pl-6 mt-1 space-y-1">
                  <li>
                    Quanto você gastou em cada categoria (alimentação,
                    transporte, etc.)
                  </li>
                  <li>Como seus gastos evoluíram ao longo dos meses</li>
                  <li>
                    Qual categoria consumiu a maior parte do seu orçamento
                  </li>
                </ul>
              </li>
              <li>
                <strong>Alertas de limite</strong>: Avisos coloridos aparecem
                quando você está perto de estourar o limite definido para alguma
                categoria. Uma barra mostra quanto % do limite você já usou.
              </li>
            </ul>
            <p className="font-semibold mb-2">Como usar a Dashboard:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Escolha o período</strong>: No topo da página há filtros
                onde você pode selecionar o mês e ano que deseja visualizar.
              </li>
              <li>
                <strong>Analise os gráficos</strong>: Passe o mouse sobre as
                áreas dos gráficos para ver detalhes de cada categoria.
              </li>
              <li>
                <strong>Fique de olho nos alertas</strong>: Se aparecer um aviso
                vermelho ou amarelo, significa que você está gastando muito em
                alguma categoria.
              </li>
            </ul>
            <p className="mt-3 text-sm italic">
              <strong>Observação:</strong> Para que os gráficos apareçam
              corretamente, certifique-se de que você criou categorias e definiu
              uma cor para cada uma (você faz isso na página Categorias).
            </p>
          </>
        ),
      },
      {
        id: "despesas",
        title: "Como Registrar Despesas",
        body: (
          <>
            <p className="mb-3">
              A página de <strong>Despesas</strong> é onde você anota todos os
              seus gastos. Pode ser desde um cafézinho até o pagamento do
              aluguel - tudo que você gastar deve ser registrado aqui para ter
              um controle completo.
            </p>
            <p className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <strong>⚠️ IMPORTANTE:</strong> Antes de registrar despesas, você precisa <strong>criar categorias</strong> na página de Categorias. Sem categorias cadastradas, não será possível adicionar despesas!
            </p>
            <p className="mb-3">
              <strong>Como cadastrar uma nova despesa:</strong>
            </p>
            <ol className="list-decimal pl-5 space-y-2 mb-3">
              <li>
                <strong>Clique no botão de adicionar</strong> (geralmente um
                botão verde ou com símbolo de +).
              </li>
              <li>
                <strong>Escolha como você pagou</strong>: Dinheiro, Pix ou
                Cartão de Crédito.
              </li>
              <li>
                <strong>Selecione a categoria</strong>: Escolha em qual grupo
                esse gasto se encaixa (por exemplo: Alimentação, Transporte,
                Lazer).
              </li>
              <li>
                <strong>Informe o valor</strong>: Digite quanto você gastou.
              </li>
              <li>
                <strong>Escolha a data</strong>: Quando você fez essa compra.
              </li>
              <li>
                <strong>Adicione observações (opcional)</strong>: Você pode
                escrever uma nota para lembrar o que foi (ex: Pizza com amigos).
              </li>
            </ol>

            <p className="font-semibold mb-2">Tipos especiais de despesas:</p>
            <ul className="list-disc pl-5 space-y-2 mb-3">
              <li>
                <strong>Despesas no Cartão de Crédito</strong>: Quando você
                escolhe pagar com cartão, o sistema pede para você selecionar
                qual cartão usou. Se a compra foi parcelada (dividida em várias
                vezes), informe o número de parcelas. O sistema vai calcular
                automaticamente e distribuir o valor pelos próximos meses.
              </li>
              <li>
                <strong>Despesas Fixas</strong>: São gastos que se repetem todo
                mês (como aluguel, internet, academia). Marque a opção Despesa
                Fixa e o sistema criará automaticamente esse gasto nos próximos
                meses até dezembro, sem você precisar cadastrar novamente.
              </li>
            </ul>

            <p className="font-semibold mb-2">Gerenciando suas despesas:</p>
            <ul className="list-disc pl-5 space-y-2 mb-3">
              <li>
                <strong>Procurar despesas</strong>: Use a barra de busca no topo
                para encontrar gastos específicos pelo nome ou descrição.
              </li>
              <li>
                <strong>Filtrar por categoria</strong>: Veja apenas despesas de
                uma categoria específica.
              </li>
              <li>
                <strong>Editar</strong>: Clique no ícone de lápis para corrigir
                informações de uma despesa. Atenção: despesas pagas no cartão
                não podem ser editadas, apenas excluídas.
              </li>
              <li>
                <strong>Excluir</strong>: Clique no ícone de lixeira para
                remover uma despesa. Se for uma compra parcelada no cartão,
                todas as parcelas serão removidas e o limite do cartão será
                devolvido.
              </li>
            </ul>

            <p className="font-semibold mb-2">Dicas importantes:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Registre assim que gastar</strong>: Não deixe acumular!
                Anote suas despesas logo após fazer uma compra para não
                esquecer.
              </li>
              <li>
                <strong>Use categorias específicas</strong>: Em vez de apenas
                Alimentação, crie subcategorias como Mercado, Restaurante,
                Lanche. Isso ajuda a entender melhor seus hábitos.
              </li>
              <li>
                <strong>Cuidado ao editar despesas antigas</strong>: Se você já
                configurou limites de gastos ou tem despesas no cartão, evite
                ficar alterando lançamentos antigos - isso pode bagunçar seus
                cálculos. Prefira fazer ajustes no mês atual.
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "receitas",
        title: "Receitas",
        body: (
          <>
            <p className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <strong>⚠️ IMPORTANTE:</strong> Antes de registrar receitas, você precisa <strong>criar categorias de receita</strong> na página de Categorias. Sem categorias cadastradas, não será possível adicionar receitas!
            </p>
            <p className="mb-3">
              Cadastre <strong>receitas</strong> (salário, vendas, freelance),
              com categoria, data e valor. Acompanhe por mês/ano e por origem.
            </p>
            <ul className="list-disc pl-5 space-y-1 mb-3">
              <li>
                <strong>Resumo por categoria</strong>: veja quais fontes mais
                contribuem.
              </li>
              <li>
                <strong>Evolução mensal</strong>: identifique tendências e meses
                atípicos.
              </li>
              <li>
                <strong>Busca e filtros</strong>: agilizam a localização de
                lançamentos específicos.
              </li>
            </ul>
            <p className="font-semibold">Dicas</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Mantenha categorias de receita simples (ex.: Salário, Vendas,
                Freelance) para relatórios mais claros.
              </li>
              <li>
                Use observações para marcar receitas não recorrentes ou bônus.
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "cartoes",
        title: "Cartões",
        body: (
          <>
            <p className="mb-3">
              Gerencie seus <strong>cartões de crédito</strong>: limite total,
              limite disponível, fechamento e vencimento da fatura. Esta é a
              área mais “regrada” do sistema, pois controla ciclos de fatura e
              pagamento.
            </p>

            <div className="space-y-4">
              <div>
                <p className="font-semibold">
                  Como funciona o ciclo (fechamento × vencimento)
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Vencimento</strong>: dia em que você paga a fatura
                    (ex.: dia <em>15</em>).
                  </li>
                  <li>
                    <strong>Fechamento</strong>: ocorre <em>X</em> dias antes do
                    vencimento (ex.: fecha <em>10 dias</em> antes ⇒ fecha no dia{" "}
                    <em>5</em>).
                  </li>
                  <li>
                    Compras <strong>até o dia do fechamento</strong> entram na
                    fatura que vence no mês atual.
                  </li>
                  <li>
                    Compras <strong>após o fechamento</strong> entram na{" "}
                    <u>próxima</u> fatura (mês seguinte).
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-semibold">Competência da fatura</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Toda despesa de cartão recebe uma{" "}
                    <strong>competência (mês/ano)</strong> calculada pela{" "}
                    <strong>data da compra</strong>, pelo vencimento e pelos
                    dias de fechamento.
                  </li>
                  <li>
                    Se a competência já estiver <strong>paga</strong>, novas
                    despesas para aquele mês/ano são <strong>bloqueadas</strong>
                    .
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-semibold">Adicionar despesas no cartão</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    O sistema valida <strong>limite disponível</strong> e a{" "}
                    <strong>competência paga</strong>.
                  </li>
                  <li>
                    <strong>À vista</strong>: reduz o limite pelo valor total
                    imediatamente.
                  </li>
                  <li>
                    <strong>Parcelada</strong>: registra as parcelas em
                    competências futuras e reduz o limite pelo{" "}
                    <strong>total da compra</strong> no ato.
                  </li>
                  <li>
                    Despesas no cartão <strong>não podem ser editadas</strong>{" "}
                    depois de criadas (para manter a integridade do ciclo). É
                    possível excluir; ao excluir, o limite é devolvido.
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-semibold">Pagamento da fatura</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    O botão <strong>Pagar</strong> só fica ativo{" "}
                    <strong>após o fechamento</strong> do ciclo vigente.
                  </li>
                  <li>
                    Ao pagar, o limite é <strong>devolvido</strong> e a
                    competência é marcada como <strong>paga</strong>.
                  </li>
                  <li>
                    Após pagar, você ainda pode lançar novas despesas no mês
                    corrente — elas entrarão na <strong>próxima</strong>{" "}
                    competência (seguindo a regra de fechamento).
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-semibold">Edição do cartão</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    É possível alterar <strong>nome</strong>,{" "}
                    <strong>número (4 dígitos)</strong>,<strong> tipo</strong>,{" "}
                    <strong>cor</strong> e <strong>limite</strong>.
                  </li>
                  <li>
                    <strong>Vencimento</strong> e{" "}
                    <strong>dias de fechamento</strong> não são alterados na
                    edição (evita reclassificar faturas já pagas).
                  </li>
                  <li>
                    O <strong>limite disponível</strong> é recalculado com base
                    no <strong>saldo em aberto</strong> apenas (não reconta
                    faturas já pagas).
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-semibold">Exclusão do cartão</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Não é possível excluir se houver{" "}
                    <strong>despesas no mês atual</strong>.
                  </li>
                  <li>
                    Se houver despesas em meses anteriores, ao excluir o cartão
                    essas despesas também serão <strong>removidas</strong>.
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-semibold">Exemplos rápidos</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Vence 15, fecha 10 dias antes (dia 5)</strong>:
                    compra em <em>03/08</em> entra na fatura que vence{" "}
                    <em>15/08</em>; compra em <em>12/08</em> entra na fatura que
                    vence <em>15/09</em>.
                  </li>
                  <li>
                    Pagou a fatura de <em>08/2025</em>? Novas despesas cuja
                    competência seja <em>08/2025</em> serão bloqueadas.
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-semibold">Dicas</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Escolha um <strong>vencimento</strong> logo após a data em
                    que você costuma receber (facilita pagar a fatura sem
                    aperto).
                  </li>
                  <li>
                    Ajuste os <strong>dias de fechamento</strong> conforme o
                    emissor do cartão (ex.: 7–10 dias é comum).
                  </li>
                  <li>
                    Se precisar corrigir algo já pago, prefira{" "}
                    <strong>lançar um ajuste</strong> em vez de editar despesas
                    antigas.
                  </li>
                </ul>
              </div>
            </div>
          </>
        ),
      },
      {
        id: "categorias",
        title: "Categorias & Subcategorias",
        body: (
          <>
            <p className="mb-3">
              Crie <strong>categorias</strong> e <strong>subcategorias</strong>{" "}
              para organizar gastos e receitas. As cores alimentam gráficos e
              painéis.
            </p>
            <ul className="list-disc pl-5 space-y-1 mb-3">
              <li>
                <strong>Hierarquia</strong>: uma categoria pai pode ter várias
                subcategorias; os resumos consideram ambas.
              </li>
              <li>
                <strong>Cores</strong>: usadas nos gráficos; escolha cores
                distintas para melhor leitura.
              </li>
              <li>
                <strong>Integridade</strong>: não é possível excluir uma
                categoria com despesas/receitas vinculadas (evita órfãos).
              </li>
            </ul>
            <p className="font-semibold">Sugestões</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Evite excesso de subcategorias; mantenha de 3 a 6 por pai para
                relatórios limpos.
              </li>
              <li>
                Reutilize categorias ao máximo para facilitar comparativos
                mensais.
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "limites",
        title: "Limites por Categoria",
        body: (
          <>
            <p className="mb-3">
              Defina <strong>limites mensais</strong> por categoria. O Nexus
              calcula a <strong>porcentagem utilizada</strong>, destaca
              <strong> excedentes</strong> e mostra histórico de alterações.
            </p>
            <ul className="list-disc pl-5 space-y-1 mb-3">
              <li>
                <strong>Cards de limite</strong>: barra de progresso, valor
                gasto, limite e excedente; botões de editar e histórico.
              </li>
              <li>
                <strong>Escopo</strong>: limites se aplicam à categoria pai e
                somam as subcategorias.
              </li>
              <li>
                <strong>Alertas</strong>: aparecem na Dashboard ao ultrapassar o
                limite.
              </li>
            </ul>
            <p className="font-semibold">Estratégia</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Comece com limites baseados na{" "}
                <strong>média dos últimos 3–6 meses</strong>.
              </li>
              <li>
                Ajuste ao longo do mês conforme imprevistos, mantendo um{" "}
                <strong>colchão de segurança</strong>.
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "config",
        title: "Configurações",
        body: (
          <>
            <p className="mb-3">
              Ajuste preferências do sistema: tema claro/escuro, dados da conta
              e segurança (login).
            </p>
            <ul className="list-disc pl-5 space-y-1 mb-3">
              <li>
                <strong>Tema</strong>: alternância pelo botão na sidebar; toda a
                UI responde via variáveis CSS.
              </li>
              <li>
                <strong>Conta</strong>: gerenciamento de dados pessoais e
                sessão.
              </li>
              <li>
                <strong>Autenticação</strong>: cookies HttpOnly, proteção por
                JWT e expiração de sessão.
              </li>
            </ul>
            <p className="font-semibold">Dica</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Caso o tema não mude em modais/overlays, verifique se a classe{" "}
                <code>dark</code> está no <code>html</code> (não apenas no{" "}
                <code>body</code>).
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "faq",
        title: "FAQ - Perguntas Frequentes",
        body: (
          <>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Posso editar uma despesa fixa?</strong> Sim, a edição
                afeta as cópias futuras; lançamentos já criados permanecem.
              </li>
              <li>
                <strong>Excluir cartão apaga despesas?</strong> Só é permitido
                excluir cartão sem despesas vinculadas (integridade dos dados).
              </li>
              <li>
                <strong>A média por despesa sumiu?</strong> Converta o campo
                para número antes de <code>toFixed</code> e valide nulos.
              </li>
              <li>
                <strong>Gráficos sem cor?</strong> Defina cores nas categorias;
                os gráficos usam essas cores.
              </li>
              <li>
                <strong>Despesa no cartão não edita?</strong> É por regra de
                ciclo; exclua para estornar limite e relance corretamente.
              </li>
            </ul>
          </>
        ),
      },
    ],
    []
  );

  const filtered = useMemo(() => {
    if (!q.trim()) return sections;
    const s = q.toLowerCase();
    return sections.filter((sec) =>
      (sec.title + " " + (typeof sec.body === "string" ? sec.body : ""))
        .toLowerCase()
        .includes(s)
    );
  }, [q, sections]);

  return (
    <main className="min-h-screen px-5 sm:px-8 lg:px-10 py-8 lg:py-4 bg-[var(--page-bg)] text-[var(--foreground)]">
      <div className="w-full mx-auto">
        <div className="mb-6">
          <PageTitle
            title="Manual"
            subTitle="Aprenda a usar o Nexus passo a passo."
          />
        </div>

        <div className="mb-8">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar no manual (ex.: despesas, cartões, limites)"
            className="w-full rounded-xl border px-4 py-3 bg-[var(--filter-input-bg)] border-[var(--filter-input-border)] text-[var(--filter-text)] placeholder-[var(--filter-placeholder)] outline-none focus:ring-2 focus:ring-[#00D4D4]"
          />
        </div>

        <div className="space-y-3">
          {filtered.map((sec) => (
            <AccordionItem key={sec.id} title={sec.title}>
              {sec.body}
            </AccordionItem>
          ))}
        </div>

        <div className="mt-10 text-sm text-[var(--foreground)]/70">
          Precisa de ajuda? Entre em contato pelo suporte do Nexus.
        </div>
      </div>
    </main>
  );
}
