# Nexus Flow — próximos passos

> Estado em 11/08/2026. Ordenado por dependência: cada bloco assume o anterior pronto.

O objetivo é um app pessoal de finanças, mobile-first e dark, com os dados
bancários entrando sozinhos via Open Finance (Pluggy) em vez de digitação manual.
A referência visual é o Pierre; a estrutura é o app que já existe.

---

## Onde estamos

**Pronto**

- Fundação do design system: `globals.css` com `@theme` do Tailwind v4, 11 tokens,
  utilitários `num` / `glow` / `rise`, overlay de grão.
- Tipografia: Bricolage Grotesque (valores e títulos) + Manrope (corpo).
- `cn()` com `twMerge`; `tailwind.config.ts` morto removido.
- Aurora de fundo (`public/aurora.svg`) no dashboard, login e assistente.
- Wrapper `ui/modal.tsx` e os 15 modais migrados.
- `ui/button.tsx` e `ui/input.tsx` nos tokens.
- Login e assistente repaginados.
- Repositório migrado para `Nexus-Flow` com os 158 commits.

**Linha de base a manter verde:** 252 testes / 18 arquivos, `type-check` e `lint` limpos.

---

## 1. Shell mobile-first

Sem isto o app continua sendo um painel desktop com cores novas.

- [ ] `components/layout/bottom-nav.tsx` — 5 abas (Home · Atividades · Cartões ·
      Assistente · Perfil), `backdrop-blur`, aba ativa com `glow`,
      `env(safe-area-inset-bottom)` respeitado.
- [ ] `components/layout/page-wrapper.tsx` — `max-w-[430px] mx-auto px-5 pb-24`.
- [ ] `components/layout/fab.tsx` — círculo 56px da marca, abre o lançamento manual.
- [ ] `layoutWrapper.tsx` monta `BottomNav`; **deletar `sidebar.tsx`** (315 linhas).
- [ ] Remover `contexts/themeContext.tsx` e `components/toggles/` — só podem sair
      junto com a sidebar, que é quem consome o `ThemeToggle`.

**Rotas.** Sobram 10 páginas financeiras para 5 abas:

| Aba | Rota | Nota |
|---|---|---|
| Home | `/dashboard` | |
| Atividades | `/atividades` *(nova)* | funde `/despesas` + `/receitas` numa lista só, com chips *Entradas / Saídas / Período*. As duas rotas antigas redirecionam |
| Cartões | `/cartoes` | |
| Assistente | `/assistente` | pronto |
| Perfil | `/perfil` *(nova)* | hub: Categorias, Limites, Planos, Conexões bancárias, Configurações, Manual |

Atualizar `middleware.ts` conforme as rotas mudarem.

---

## 2. Telas

- [ ] **Dashboard** — bloco-herói de saldo (número em Bricolage e sparkline
      ocupando o mesmo espaço), grid de widgets, `balanceChart` vira área com
      gradiente lima e eixo Y oculto.
- [ ] **Atividades** — agrupamento por dia com header ("Ontem", "Domingo"), ícone
      redondo da instituição, valor com sinal colorido. É a tela mais usada;
      merece o maior cuidado de densidade e área de toque.
- [ ] **Cartões** — `cardVisual.tsx` (358 linhas) com fatura e vencimento em
      destaque, limite em donut.
- [ ] **Perfil** — hub em lista.
- [ ] Restantes nos tokens: `/categorias`, `/limites`, `/planos`,
      `/configuracoes`, `/register`, `/forgot-password`, `/reset-password`,
      `/verify-email`, `/` (landing).
- [ ] `/manual` (752 linhas) — o conteúdo documenta funcionalidades que serão
      removidas; reescrever por último.

---

## 3. Movimento e estados

- [ ] `framer-motion` (já instalado, nunca usado): cascata de entrada no
      dashboard, transição entre abas, spring no FAB, count-up do saldo.
- [ ] Loading com skeleton nos tokens novos, empty states desenhados, error states.
- [ ] `prefers-reduced-motion` já está tratado no `globals.css` — manter.

> **Cuidado com o count-up.** No protótipo, animar a partir de zero deixava o
> saldo em `0` quando o `requestAnimationFrame` não disparava (aba em segundo
> plano). O valor final deve estar no HTML e a animação só sobrescrever depois
> que o primeiro frame roda.

---

## 4. Limpeza de escopo

**A ordem importa** — o passo 1 é pré-requisito dos demais.

1. [ ] Mover `parseAmount` de `server/utils/import/types.ts` para
       `server/utils/helper.ts` e atualizar `chatActionService.ts:6`.
       **Sem isso, apagar a pasta `import/` quebra o assistente de IA.**
2. [ ] Preservar as regras de palavra-chave de `server/utils/import/categorize.ts`
       — viram a base da categorização da Pluggy.
3. [ ] Deletar `app/importar/`, `app/api/imports/`, `importService.ts`,
       `server/utils/import/` e os 2 specs.
4. [ ] Deletar `app/{carreira,estudos,pessoal}/`, `app/api/{career,study,personal}/`,
       os 3 services e os 3 specs.
5. [ ] **Editar o array `TABLES` em `server/__tests__/mocks/db.ts:24`** — remover
       `imported_transactions`, `import_batches`, `career_profile`,
       `career_milestones`, `study_items`, `personal_goals`.
       É um array hardcoded usado no `TRUNCATE`: sem essa edição **a suíte
       inteira quebra**.
6. [ ] `drizzle/0005_remove_import_and_personal.sql` com os `DROP TABLE`.

> ⚠️ `npm run db:push` faz diff de `schema.ts` contra o banco e **não executa**
> os `drizzle/*.sql`. Esses arquivos existem para o `mocks/db.ts` replicar no
> PGlite. Toda mudança de schema vai em **dois lugares**, senão produção funciona
> e os testes quebram.

---

## 5. Pluggy (Open Finance)

A ideia central é escrever as transações da Pluggy **nas tabelas `expenses` /
`incomes` que já existem**, via colunas aditivas. Com isso, dashboard, gráficos,
limites, metas, carryover e o contexto do assistente passam a funcionar com dados
bancários **sem alterar nenhum service**.

### Schema

- [ ] Colunas em `expenses` e `incomes`: `pluggy_transaction_id`,
      `pluggy_account_id`, `origem` (`'manual' | 'pluggy'`), `categoria_manual`.
- [ ] Tabelas `pluggy_items` e `pluggy_accounts`.
- [ ] Índice único **parcial** — linhas manuais são `NULL` e não colidem:
      ```sql
      CREATE UNIQUE INDEX expenses_pluggy_tx_key ON expenses(pluggy_transaction_id)
        WHERE pluggy_transaction_id IS NOT NULL;
      ```

### Backend

```
server/utils/pluggy/{client,mapper,categorize}.ts
server/services/{pluggyItemService,pluggySyncService}.ts
app/api/pluggy/{connect-token,items,items/[id],sync,webhook}/route.ts
```

### Armadilhas já mapeadas

- **`/api/pluggy/connect-token` é `GET`, não `POST`.** O usuário sai do JWT, não
  do body — assim o `fetch('/api/connect-token')` do componente React fecha.
- **O webhook responde primeiro e processa depois.** `await handleItemUpdated()`
  antes do `return` estoura o orçamento de 5s; a Pluggy trata como falha e
  reenvia até 9 vezes, disparando syncs concorrentes do mesmo item. Use
  `after()` do `next/server`, com `processEvent` idempotente por `eventId` e
  lock por `itemId`.
- **Autenticar o webhook antes de processar** — a rota é pública. Header
  customizado registrado no `createWebhook`, comparado com `timingSafeEqual`.
- **Sinal do `amount` não é confiável** entre conectores. Decidir despesa vs
  receita por `type` (`DEBIT`/`CREDIT`) e gravar `Math.abs()`.
- **`metodo_pagamento` do crédito é `"cartao de credito"`** — literal exato, sem
  acento nem cedilha. `expenseList.tsx:225` compara com `!==`.
- **Linhas sincronizadas gravam direto via `db.insert`**, sem passar por
  `handleCreditCardExpense`: senão o `limite_disponivel` seria decrementado duas
  vezes. A Pluggy vira a fonte da verdade do limite.
- **`creditCardMetadata.totalInstallments` é só rótulo.** A Pluggy manda cada
  parcela como transação separada; rodar o gerador de parcelas do app duplica.
- **`expenseService.ts:527` bloqueia edição de despesa de crédito** — precisa
  liberar para `origem = 'pluggy'`, senão é impossível re-categorizar.
- **Webhook não alcança `localhost`** — botão "Sincronizar agora" no dev, webhook
  em produção, cron diário reaproveitando `.github/workflows/supabase-keepalive.yml`.

### Env

`PLUGGY_CLIENT_ID`, `PLUGGY_CLIENT_SECRET`, `PLUGGY_WEBHOOK_SECRET`,
`NEXT_PUBLIC_APP_URL`. A *API key* não entra: é um token derivado de ~2h que o
`PluggyClient` gera a partir do id/secret.

### Testes

`pluggySyncService.test.ts` — sync duas vezes não duplica; `DEBIT`→despesa e
`CREDIT`→receita; conta `CREDIT` preenche `competencia_mes/ano`; re-sync **não**
sobrescreve `category_id` quando `categoria_manual = true`; `transactions/deleted`
remove a linha. `mapper.test.ts` — `creditData` → colunas de `cards`; amount
positivo num conector de cartão ainda vira despesa.

---

## Dívida técnica consciente

| Item | Onde | Quando resolver |
|---|---|---|
| **Ponte de compatibilidade CSS** — ~470 referências a `var(--card-bg)` e afins de ~65 componentes ainda passam por aliases temporários | `globals.css`, bloco marcado | Remover quando o bloco 2 terminar. Acompanhar com `grep -rho "var(--card-\|var(--filter-\|var(--chart-\|var(--select-" src/` |
| Formulário de meta duplicado quase idêntico | `newGoalModal.tsx` / `editGoalModal.tsx` | Extrair um `GoalForm` compartilhado |
| `getSaldoFuturo` é byte-idêntico a `getSaldoAtual` — não filtra datas futuras | `server/utils/finance/` | Corrigir ou remover |
| `saveExpenseHistory` escreve numa tabela `expense_history` que não existe em nenhuma migration | `server/utils/finance/` | Código morto: remover |
| `/api/users/currency/convert` (POST) não chama `getAuthUser` | `app/api/users/currency/` | Adicionar auth |
| Infra multi-usuário (convites, painel admin, verificação por SMTP) num app de um usuário só | vários | Decidir se remove |
| `next lint` deprecado no Next 16 | `package.json` | `npx @next/codemod@canary next-lint-to-eslint-cli .` |
| Zero testes de frontend, rota ou E2E | — | A skill `webapp-testing` está instalada |

---

## Verificação a cada bloco

1. `npm run type-check` e `npm run lint` limpos.
2. `npm test` verde — 252 testes é a linha de base.
3. Browser no preset mobile (375×812): screenshot das 5 abas, console sem erros,
   zero scroll horizontal. Depois no desktop, confirmando o container de 430px.
4. Fluxo ponta a ponta: FAB → despesa → aparece em Atividades → reflete no saldo
   do Dashboard → dispara alerta se estourar um limite.
5. Lighthouse mobile depois do bloco 3, olhando CLS.
