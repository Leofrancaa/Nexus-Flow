# Banco local / de teste

Dois arquivos para levantar um Supabase novo do zero. Rode na ordem, colando
cada um inteiro no **SQL Editor** do projeto.

| Arquivo | O que faz |
|---|---|
| `01-schema.sql` | Cria todas as tabelas. Idempotente — rodar de novo não quebra. |
| `02-seed.sql` | Usuário de teste + categorias, cartão, ~30 lançamentos, limites, metas e planos. |

## Passo a passo

1. Crie o projeto em [supabase.com/dashboard](https://supabase.com/dashboard) e
   guarde a senha do banco que ele pede na criação.
2. **SQL Editor → New query**, cole o `01-schema.sql`, *Run*.
3. Nova query, cole o `02-seed.sql`, *Run*.
4. **Project Settings → Database → Connection string → URI**, copie e troque
   `[YOUR-PASSWORD]` pela senha do passo 1.
5. Preencha o `.env.local` na raiz do projeto:

   ```
   DATABASE_URL=postgresql://postgres:SUA_SENHA@db.xxxx.supabase.co:5432/postgres?sslmode=require
   JWT_SECRET=qualquer-string-longa-e-aleatoria
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

   O `?sslmode=require` no fim não é opcional: o `pg` não fala com o Supabase
   sem TLS. E se este banco for só de teste, o `JWT_SECRET` pode ser qualquer
   coisa — ele só precisa ser o mesmo de produção quando os dois compartilham
   usuários.

6. `npm run dev` e entre com:

   ```
   teste@nexus.dev
   nexus123
   ```

## Detalhes que valem saber

**As datas do seed são relativas.** Tudo é calculado a partir de
`CURRENT_DATE`, então o mês corrente sempre tem movimento e nada cai no futuro.
Rodar o seed duas vezes duplica os lançamentos; no fim do arquivo há um
`TRUNCATE` comentado para recomeçar.

**O que ficou de fora do dump de produção.** Além da `recurring_expenses`, que
nenhuma linha do código referencia, saíram as tabelas dos módulos removidos no
bloco 4: `import_batches`, `imported_transactions`, `career_profile`,
`career_milestones`, `study_items` e `personal_goals`. A `expense_history`
entrou, porque o `saveExpenseHistory.ts` escreve nela — ela existe em produção e
no bootstrap dos testes, mas em nenhuma migration do drizzle.

**Se você já tem um banco com as tabelas antigas**, rode o
`drizzle/0006_remove_import_and_personal.sql` para derrubá-las.

**As tabelas da Pluggy nascem vazias.** `pluggy_items`, `pluggy_accounts` e as
colunas aditivas em `expenses`/`incomes` são o bloco 5 do ROADMAP; o código que
as preenche ainda não existe. Elas estão aqui para o banco não precisar de
migration no meio daquele trabalho.

**Chaves estrangeiras.** As migrations do drizzle não declaram FK; produção tem.
Mantive as de produção. Se um dia `npm run db:push` propuser removê-las, recuse.

**Schema muda em dois lugares.** `npm run db:push` faz diff do `schema.ts`
contra o banco e **não** executa os `drizzle/*.sql` — esses existem para o
`server/__tests__/mocks/db.ts` replicar o mesmo schema no PGlite. Alterou um,
altere o outro, senão produção funciona e os testes quebram.
