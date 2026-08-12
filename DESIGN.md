---
name: Nexus
description: Controle financeiro pessoal com precisão silenciosa e atmosfera cinematográfica.
colors:
  signal-lime: "#D4FF00"
  night-canvas: "#080A0D"
  graphite-surface: "#131518"
  lifted-surface: "#1A1D21"
  hairline: "#2A2D32"
  text-primary: "#F5F7F8"
  text-muted: "#A4A8AF"
  text-subtle: "#61666F"
  positive: "#A3E635"
  negative: "#F26470"
  warning: "#F4A621"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Manrope, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 450
    lineHeight: 1.5
  label:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
rounded:
  control: "14px"
  card: "22px"
  sheet: "28px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.signal-lime}"
    textColor: "{colors.night-canvas}"
    rounded: "{rounded.control}"
    padding: "14px 20px"
  card:
    backgroundColor: "{colors.graphite-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.card}"
    padding: "20px"
  input:
    backgroundColor: "{colors.lifted-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.control}"
    padding: "14px 16px"
---

# Design System: Nexus

## Overview

**Creative North Star: "Observatório Financeiro"**

O Nexus é um instrumento pessoal para enxergar o mês com a mesma clareza de um observatório enxergando o céu: o ambiente é escuro, silencioso e preciso; os dados importantes emitem luz apenas quando merecem atenção. Imagens cinematográficas podem estabelecer atmosfera no topo de superfícies especiais, enquanto todo o conteúdo operacional permanece sóbrio e legível.

O sistema rejeita aparência de banco tradicional, estética de cassino cripto, interface gamer e cópia literal do Pierre. A assinatura própria é o **Pulso Nexus**, uma linha de sinal lima que conecta estados financeiros relacionados sem virar ornamento ou funcionalidade inventada.

**Key Characteristics:**

- Preto frio e grafite com profundidade tonal, nunca preto puro.
- Verde-lima raro, reservado a ação, seleção, progresso e sinal vivo.
- Números financeiros amplos e tabulares; rótulos curtos e discretos.
- Movimento curto, contínuo e funcional.
- Fotografia arquitetônica noturna usada como atmosfera, não como decoração recorrente.

## Colors

A paleta usa uma noite azulada como campo, grafite como instrumento e lima como sinal elétrico controlado.

### Primary

- **Signal Lime:** ação primária, seleção, foco, progresso e Pulso Nexus. Nunca colore grandes superfícies.

### Secondary

- **Positive:** entradas e estados financeiros favoráveis.
- **Negative:** despesas, erros e ações destrutivas.
- **Warning:** atenção intermediária e limites próximos do teto.

### Neutral

- **Night Canvas:** fundo estrutural do aplicativo.
- **Graphite Surface:** cards e folhas modais.
- **Lifted Surface:** controles, hover e blocos internos.
- **Hairline:** separadores e bordas de baixo contraste.
- **Text Primary, Muted e Subtle:** hierarquia textual em três níveis.

**The Signal Rule.** Signal Lime ocupa menos de 10% da tela. Sua raridade é o que faz o sistema parecer vivo.

## Typography

**Display Font:** Bricolage Grotesque (com Manrope como fallback)
**Body Font:** Manrope (com system-ui como fallback)

**Character:** Bricolage aparece apenas em saudações e números de alta importância. Manrope mantém controles e leitura operacional familiares.

### Hierarchy

- **Display** (700, 2.5rem, 1): saldo principal e saudação do dashboard.
- **Headline** (700, 1.5rem, 1.15): títulos de superfícies e valores secundários.
- **Title** (650, 1rem, 1.3): títulos de cards, modais e listas.
- **Body** (450, 1rem, 1.5): formulários e mensagens.
- **Label** (600, 0.75rem, 1.2): metadados, estados e navegação.

**The Number First Rule.** Em superfícies financeiras, o valor é lido antes da explicação; tamanho e alinhamento devem refletir essa ordem.

## Elevation

A profundidade vem primeiro da diferença entre Night Canvas, Graphite Surface e Lifted Surface. Sombras são ambientais, largas e escuras; nunca simulam cartões brancos flutuando. Modais recebem uma borda clara muito sutil e sombra profunda para separar a folha do conteúdo.

**The Tonal Depth Rule.** Superfícies permanecem planas em repouso. Elevação aparece apenas em modais, menus flutuantes e resposta ao toque.

## Components

### Buttons

- **Shape:** retângulo suavemente curvo (14px).
- **Primary:** Signal Lime, texto Night Canvas, peso 650 e altura mínima de 48px.
- **Hover / Focus:** brilho curto e anel de foco visível; toque comprime até 98%.
- **Secondary / Ghost:** grafite elevado ou fundo transparente com hairline.

### Chips

- **Style:** pill discreta, hairline e texto muted.
- **State:** selecionado usa fundo lima translúcido e texto lima, nunca preenchimento sólido em toda a área.

### Cards / Containers

- **Corner Style:** curva contínua de 22px.
- **Background:** Graphite Surface com variação tonal sutil.
- **Shadow Strategy:** sem sombra em repouso; resposta tonal no toque.
- **Border:** hairline com baixa opacidade apenas quando necessário para separar fundos semelhantes.
- **Internal Padding:** 16px em métricas compactas e 20px em gráficos.

### Inputs / Fields

- **Style:** Lifted Surface, hairline, altura mínima de 56px e curva de 14px.
- **Focus:** borda Signal Lime a 60% e halo a 18%.
- **Error / Disabled:** Negative sem remover o texto explicativo; disabled reduz contraste, não legibilidade.

### Navigation

Cinco destinos fixos: Home, Atividades, Cartões, Assistente e Perfil. O ativo usa ícone e rótulo Signal Lime com uma linha fina do Pulso Nexus. Atividades usa duas setas horizontais em direções opostas.

### Pulso Nexus

Linha contínua de sinal que pode desenhar um gráfico, preencher um anel ou indicar a aba ativa. Tem duração entre 450 e 750ms, easing exponencial de saída e nunca cria um botão ou destino próprio.

## Do's and Don'ts

### Do:

- **Do** priorizar saldo, ritmo de gastos e compromissos em uma leitura de cinco segundos.
- **Do** usar Signal Lime apenas para estados vivos e ações reais.
- **Do** animar transform e opacity com transições entre 150 e 750ms.
- **Do** respeitar `prefers-reduced-motion` e manter todos os fluxos compreensíveis sem animação.
- **Do** manter alvos de toque com pelo menos 44px.

### Don't:

- **Don't** reproduzir aparência de banco tradicional, burocrática e impessoal.
- **Don't** usar estética de cassino cripto, excesso de brilho, urgência ou estímulos.
- **Don't** criar interface gamer, HUDs ou ornamentos sem função.
- **Don't** usar animações bruscas, espalhafatosas ou distribuídas sem propósito.
- **Don't** copiar literalmente o Pierre.
- **Don't** transformar o Pulso Nexus em funcionalidade, botão ou navegação.
- **Don't** usar glassmorphism como padrão, texto em gradiente ou faixas laterais coloridas.
