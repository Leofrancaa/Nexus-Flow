# Nexus Flow — próximos passos

> Estado em 11/08/2026, com o bloco 1 concluído. Ordenado por dependência:
> cada bloco assume o anterior pronto.

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
- **Shell mobile-first (bloco 1).** Bottom nav de 5 abas, coluna de 430px, FAB
  de lançamento, `/atividades` e `/perfil` no ar, sidebar e tema claro fora.
- **Limpeza de escopo (bloco 4).** Importador de extrato, carreira, estudos e
  pessoal removidos do código e do banco.
- **Schema da Pluggy (parte do bloco 5).** Colunas e tabelas criadas, vazias.
- **Banco de teste** — `db/01-schema.sql` e `db/02-seed.sql` levantam um Supabase
  novo do zero, com dados de exemplo. Ver `db/README.md`.

**Linha de base a manter verde:** 204 testes / 13 arquivos, `type-check` e `lint`
limpos. (Eram 252/18 antes do bloco 4: os 5 specs dos módulos removidos saíram
junto, e os 3 testes de `parseAmount` migraram para `utils/helper.test.ts`.)

> ⚠️ `npm ci` falha: o `package-lock.json` está fora de sincronia com o
> `package.json` (faltam `esbuild`, `@emnapi/*`). Instalar sem o lock traz
> `recharts` e `vitest` mais novos, e aí `type-check` e `npm test` quebram por
> motivo alheio ao código. Regerar o lock é a próxima dívida a pagar. O
> `npm test` também exige Node ≥ 20.19 (o `vitest` 4 faz `require()` de ESM);
> em Node 20.17 roda com `NODE_OPTIONS=--experimental-require-module`.

---

## 1. Shell mobile-first ✅

Sem isto o app continuaria sendo um painel desktop com cores novas.

- [x] `components/layout/bottomNav.tsx` — 5 abas (Home · Atividades · Cartões ·
      Assistente · Perfil), `backdrop-blur`, aba ativa com `glow`,
      `env(safe-area-inset-bottom)` respeitado. Rotas-filhas (`/categorias`,
      `/limites`, …) acendem a aba Perfil.
- [x] `components/layout/pageWrapper.tsx` — `max-w-[430px] mx-auto px-5`, e é
      ele quem emite o `<main>` da página.
- [x] `components/layout/fab.tsx` — círculo 56px da marca; um toque abre
      *Nova receita* / *Nova despesa*. Escondido no assistente e no perfil.
- [x] `layoutWrapper.tsx` monta `BottomNav` + `Fab`; `sidebar.tsx` deletada.
- [x] `contexts/themeContext.tsx` e `components/toggles/` removidos.
- [x] Token `--spacing-nav` no `@theme`: a folga do rodapé virou `pb-nav`,
      aplicado uma vez no wrapper de layout — inclusive nas telas ainda não
      migradas, que senão terminariam escondidas atrás da barra.
- [x] `hooks/useDataRefresh.ts` — o FAB vive no layout e a tela que recarrega é
      filha do `children`; o aviso de "criei algo" vai por evento no `window`.

**Rotas.** As 10 páginas financeiras couberam em 5 abas:

| Aba | Rota | Nota |
|---|---|---|
| Home | `/dashboard` | |
| Atividades | `/atividades` | funde `/despesas` + `/receitas` numa lista só, agrupada por dia, com chips *Todas / Entradas / Saídas*, busca e navegação de mês. `/despesas` → `?tipo=saidas` e `/receitas` → `?tipo=entradas` |
| Cartões | `/cartoes` | ainda no visual antigo (bloco 2) |
| Assistente | `/assistente` | pronto |
| Perfil | `/perfil` | hub: Categorias, Limites, Planos, Configurações, Manual, sair. Conexões bancárias entra no bloco 5 |

`middleware.ts` atualizado; as rotas antigas continuam protegidas para o
redirect não vazar a existência da tela a quem não está logado.

---

## 2. Telas

- [ ] **Dashboard** — bloco-herói de saldo (número em Bricolage e sparkline
      ocupando o mesmo espaço), grid de widgets, `balanceChart` vira área com
      gradiente lima e eixo Y oculto.
- [ ] **Atividades** — a estrutura já está de pé (agrupamento por dia, sinal
      colorido, ação por toque). Falta o ícone redondo da instituição no lugar
      das iniciais da categoria e uma passada de densidade/área de toque — é a
      tela mais usada.
- [ ] **Cartões** — `cardVisual.tsx` (358 linhas) com fatura e vencimento em
      destaque, limite em donut.
- [x] **Perfil** — hub em lista.
- [ ] Restantes nos tokens: `/categorias`, `/limites`, `/planos`,
      `/configuracoes`, `/register`, `/forgot-password`, `/reset-password`,
      `/verify-email`.
- [x] A landing de `/` foi apagada — o app é de um usuário só, que já sabe o que
      ele faz; não havia o que vender. A raiz é um redirect no `middleware.ts`:
      logado vai para o dashboard, deslogado para o login.
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

## 4. Limpeza de escopo ✅

**A ordem importava** — o passo 1 era pré-requisito dos demais.

1. [x] `parseAmount` mudou de `server/utils/import/types.ts` para
       `server/utils/helper.ts`; `chatActionService.ts` atualizado.
       Os 3 testes dela vieram junto, para `utils/helper.test.ts`.
2. [x] As regras de palavra-chave viraram `server/utils/pluggy/categorize.ts` —
       são a base da categorização da Pluggy. Ainda sem chamador.
3. [x] Deletados `app/importar/`, `app/api/imports/`, `importService.ts`,
       `server/utils/import/` e os 2 specs.
4. [x] Deletados `app/{carreira,estudos,pessoal}/`,
       `app/api/{career,study,personal}/`, os 3 services e os 3 specs.
5. [x] Array `TABLES` de `server/__tests__/mocks/db.ts` enxugado.
6. [x] `drizzle/0006_remove_import_and_personal.sql` com os `DROP TABLE`
       (o `0005` ficou com a Pluggy), mais a remoção das tabelas do
       `schema.ts` e do `db/01-schema.sql`.

O banco tem hoje **15 tabelas** — exatamente a superfície do app.

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

### Schema ✅

Feito junto com o banco local (`db/01-schema.sql`), nos dois lugares de sempre:
`schema.ts` e `drizzle/0005_pluggy.sql`. As tabelas nascem vazias — falta o
código que as preenche.

- [x] Colunas em `expenses` e `incomes`: `pluggy_transaction_id`,
      `pluggy_account_id`, `origem` (`'manual' | 'pluggy'`), `categoria_manual`.
- [x] Tabelas `pluggy_items` e `pluggy_accounts`.
- [x] Índice único **parcial** — linhas manuais são `NULL` e não colidem:
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
| **`package-lock.json` fora de sincronia** — `npm ci` recusa; instalar sem lock derruba `type-check` e `npm test` | raiz | Antes de qualquer outra coisa: regerar o lock e conferir a suíte |
| **10 componentes órfãos** desde que `/despesas` e `/receitas` viraram redirect: `lists/{expense,income}List`, `filters/{expense,income}Filter`, `cards/{expenseStatsCard,incomesStatsCard}`, `panels/*`, `modals/new{Expense,Income}Modal` | `src/components/` | Deletar no fim do bloco 2, depois de aproveitar o que servir na nova Atividades |
| **Ponte de compatibilidade CSS** — ~470 referências a `var(--card-bg)` e afins de ~65 componentes ainda passam por aliases temporários | `globals.css`, bloco marcado | Remover quando o bloco 2 terminar. Acompanhar com `grep -rho "var(--card-\|var(--filter-\|var(--chart-\|var(--select-" src/` |
| Formulário de meta duplicado quase idêntico | `newGoalModal.tsx` / `editGoalModal.tsx` | Extrair um `GoalForm` compartilhado |
| ~~`getSaldoFuturo` byte-idêntico a `getSaldoAtual`~~ | — | ✅ `getSaldoAtual` passou a cortar em hoje; `getSaldoFuturo` segue somando tudo. Spec em `__tests__/utils/saldo.test.ts` trava a diferença |
| ~~`saveExpenseHistory` é código morto~~ | — | ✅ removido (nenhum chamador). A tabela `expense_history` fica: produção tem linhas nela |
| ~~`/api/users/currency/convert` sem `getAuthUser`~~ | — | ✅ autenticada |
| **Sessão de 30 dias, sem revogação nem limite de tentativa no login** | `server/lib/auth.ts`, `api/auth/login` | Ver a nota de segurança abaixo |
| Infra multi-usuário (convites, painel admin, verificação por SMTP) num app de um usuário só | vários | Decidir se remove |
| `next lint` deprecado no Next 16 | `package.json` | `npx @next/codemod@canary next-lint-to-eslint-cli .` |
| Zero testes de frontend, rota ou E2E | — | A skill `webapp-testing` está instalada |

---

## Nota de segurança — auth próprio x Supabase Auth

O middleware não era carregado (estava na raiz em vez de `src/`): qualquer
visitante abria `/dashboard` e recebia 200. Nenhum dado vazou — as 66 rotas de
API chamam `getAuthUser` e respondiam 401 — mas a única barreira das telas era
o `AuthGuard` no cliente. Corrigido.

O que o auth atual já faz bem: bcrypt com custo 12; cookie `httpOnly`, `secure`
em produção e `sameSite=lax`; `JWT_SECRET` obrigatório (lança se faltar); token
de reset com `randomBytes(32)`, com expiração e uso único.

O que falta, em ordem de risco:

1. **Nada limita tentativa de login.** A página é pública na internet e aceita
   quantas senhas por segundo o atacante quiser. É o buraco mais barato de
   fechar e o de maior retorno.
2. **Token vale 30 dias e não dá para revogar.** `logout` só apaga o cookie —
   quem copiou o token continua entrando por um mês. O padrão é acesso curto
   (~1h) com refresh rotativo.
3. Sem MFA e sem checagem de senha vazada.

Migrar para o Supabase Auth resolveria os três de graça, mas custa migrar os
usuários de `users.senha` para `auth.users` e refazer login, cadastro, convite,
reset e verificação de e-mail. Para um app de um usuário só, fechar (1) e (2)
no que já existe entrega quase o mesmo resultado por uma fração do trabalho.
O Supabase Auth passa a valer a pena no dia em que houver login social.

---

## Verificação a cada bloco

1. `npm run type-check` e `npm run lint` limpos.
2. `npm test` verde — 204 testes é a linha de base.
3. Browser no preset mobile (375×812): as 5 abas, console sem erros, zero
   scroll horizontal. Depois no desktop, confirmando o container de 430px.
   Sem `.env` o servidor sobe mas toda API responde 500 — dá para conferir o
   shell, não os dados.
4. Fluxo ponta a ponta: FAB → despesa → aparece em Atividades → reflete no saldo
   do Dashboard → dispara alerta se estourar um limite.
5. Lighthouse mobile depois do bloco 3, olhando CLS.
